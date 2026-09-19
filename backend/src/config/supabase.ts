import dotenv from 'dotenv';
import path from 'path';
import { DemoStore } from '../utils/demoStore';

// Robustly load .env from backend directory and cwd
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

// Helpers for camelCase <-> snake_case conversion
export const toSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

export const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
};

export const mapObjectToSnake = (obj: any): any => {
  if (!obj || typeof obj !== 'object' || obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(mapObjectToSnake);

  const newObj: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    if (key === '_id') {
      newObj['id'] = obj[key]?.toString();
    } else {
      const snakeKey = toSnakeCase(key);
      const val = obj[key];
      // Keep JSON objects / primitives
      newObj[snakeKey] = val;
    }
  }
  return newObj;
};

export const mapObjectToCamel = (obj: any): any => {
  if (!obj || typeof obj !== 'object' || obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(mapObjectToCamel);

  const newObj: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = toCamelCase(key);
    newObj[camelKey] = obj[key];
  }
  // Ensure both id and _id exist for 100% frontend compatibility
  if (newObj.id !== undefined && newObj._id === undefined) {
    newObj._id = newObj.id;
  }
  return newObj;
};

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

export class SupabaseClient {
  private static config: SupabaseConfig = {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
  };

  static getConfig(): SupabaseConfig {
    const url = (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
    const anonKey = (process.env.SUPABASE_ANON_KEY || '').trim();
    const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    this.config = {
      url,
      anonKey,
      serviceRoleKey: serviceRoleKey || anonKey
    };
    return this.config;
  }

  static isConfigured(): boolean {
    const { url, serviceRoleKey, anonKey } = this.getConfig();
    return Boolean(url && (serviceRoleKey || anonKey));
  }

  static getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
    const { anonKey, serviceRoleKey } = this.getConfig();
    // Server-side backend calls MUST use serviceRoleKey for privileged operations (seed, tenant setup, etc.)
    const key = serviceRoleKey || anonKey;
    return {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...extraHeaders
    };
  }

  static async request(endpoint: string, options: RequestInit = {}): Promise<{ data: any; status: number; count?: number }> {
    const { url } = this.getConfig();
    if (!url) {
      throw new Error('[Supabase Error] SUPABASE_URL environment variable is missing.');
    }

    const fullUrl = `${url}/rest/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = this.getHeaders(options.headers as any);

    const response = await fetch(fullUrl, {
      ...options,
      headers
    });

    let count: number | undefined;
    const contentRange = response.headers.get('content-range');
    if (contentRange) {
      const parts = contentRange.split('/');
      if (parts[1] && parts[1] !== '*') {
        count = parseInt(parts[1], 10);
      }
    }

    const text = await response.text();
    let data: any = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = text;
      }
    }

    if (!response.ok) {
      const errorMsg = data?.message || data?.hint || data?.details || (typeof data === 'string' ? data : response.statusText);
      const error: any = new Error(errorMsg || `Supabase HTTP ${response.status}`);
      error.statusCode = response.status === 404 ? 404 : (response.status === 409 ? 400 : response.status);
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return { data, status: response.status, count };
  }
}

const TENANT_TABLES = new Set([
  'patients',
  'appointments',
  'doctors',
  'prescriptions',
  'bills',
  'lab_orders',
  'pharmacy_items',
  'staff',
  'notifications',
  'audit_logs',
  'departments',
  'users'
]);

/**
 * Chainable query builder for PostgREST
 */
export class SupabaseQuery<T = any> {
  private tableName: string;
  private filters: Array<{ column: string; operator: string; value: any }> = [];
  private orClauses: string[] = [];
  private orderClauses: string[] = [];
  private selectCols: string = '*';
  private limitCount?: number;
  private offsetCount?: number;
  private singleResult: boolean = false;
  private countOnly: boolean = false;
  private populateMap: Record<string, string[]> = {};

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(fields: string | string[]): this {
    if (typeof fields === 'string') {
      const parts = fields.trim().split(/\s+/).filter(f => !f.startsWith('-'));
      if (parts.length > 0) {
        this.selectCols = parts.map(toSnakeCase).join(',');
      }
    } else if (Array.isArray(fields)) {
      this.selectCols = fields.map(toSnakeCase).join(',');
    }
    return this;
  }

  populate(path: string, selectFields?: string): this {
    const snakePath = toSnakeCase(path);
    const fields = selectFields ? selectFields.trim().split(/\s+/).map(toSnakeCase) : ['*'];
    this.populateMap[snakePath] = fields;
    return this;
  }

  where(filter: Record<string, any>): this {
    for (const [key, val] of Object.entries(filter)) {
      if (val === undefined) {
        // Critical: if clinicId is undefined for a tenant table, NEVER skip it (otherwise all tenant data leaks)
        if (key === 'clinicId' || key === 'clinic_id') {
          this.filters.push({ column: 'clinic_id', operator: 'eq', value: '__UNAUTHENTICATED_TENANT_BLOCK__' });
        }
        continue;
      }

      if (key === '$or' && Array.isArray(val)) {
        const orConditions: string[] = [];
        for (const cond of val) {
          for (const [cKey, cVal] of Object.entries(cond)) {
            const col = cKey === '_id' ? 'id' : toSnakeCase(cKey);
            if (typeof cVal === 'object' && cVal !== null) {
              const cValObj = cVal as Record<string, any>;
              if (cValObj.$regex) {
                orConditions.push(`${col}.ilike.%25${encodeURIComponent(cValObj.$regex)}%25`);
              } else if (cValObj.$in && Array.isArray(cValObj.$in)) {
                orConditions.push(`${col}.in.(${cValObj.$in.map((v: any) => encodeURIComponent(v)).join(',')})`);
              }
            } else {
              orConditions.push(`${col}.eq.${encodeURIComponent(String(cVal))}`);
            }
          }
        }
        if (orConditions.length > 0) {
          this.orClauses.push(`(${orConditions.join(',')})`);
        }
        continue;
      }

      const col = key === '_id' ? 'id' : toSnakeCase(key);

      if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
        const valObj = val as Record<string, any>;
        if (valObj.$regex) {
          this.filters.push({ column: col, operator: 'ilike', value: `%25${encodeURIComponent(valObj.$regex)}%25` });
        } else if (valObj.$in && Array.isArray(valObj.$in)) {
          this.filters.push({ column: col, operator: 'in', value: `(${valObj.$in.map((v: any) => encodeURIComponent(v)).join(',')})` });
        } else if (valObj.$nin && Array.isArray(valObj.$nin)) {
          this.filters.push({ column: col, operator: 'not.in', value: `(${valObj.$nin.map((v: any) => encodeURIComponent(v)).join(',')})` });
        } else if (valObj.$gt !== undefined) {
          this.filters.push({ column: col, operator: 'gt', value: valObj.$gt });
        } else if (valObj.$gte !== undefined) {
          this.filters.push({ column: col, operator: 'gte', value: valObj.$gte });
        } else if (valObj.$lt !== undefined) {
          this.filters.push({ column: col, operator: 'lt', value: valObj.$lt });
        } else if (valObj.$lte !== undefined) {
          this.filters.push({ column: col, operator: 'lte', value: valObj.$lte });
        } else if (valObj.$ne !== undefined) {
          this.filters.push({ column: col, operator: 'neq', value: valObj.$ne });
        }
      } else if (val === null) {
        this.filters.push({ column: col, operator: 'is', value: 'null' });
      } else {
        this.filters.push({ column: col, operator: 'eq', value: encodeURIComponent(String(val)) });
      }
    }
    return this;
  }

  sort(sortObj: Record<string, 1 | -1 | 'asc' | 'desc'>): this {
    for (const [key, dir] of Object.entries(sortObj)) {
      const col = key === '_id' ? 'id' : toSnakeCase(key);
      const isDesc = dir === -1 || dir === 'desc';
      this.orderClauses.push(`${col}.${isDesc ? 'desc' : 'asc'}`);
    }
    return this;
  }

  skip(count: number): this {
    this.offsetCount = count;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  single(): this {
    this.singleResult = true;
    return this;
  }

  count(): this {
    this.countOnly = true;
    return this;
  }

  private buildQueryString(): string {
    const params: string[] = [];

    // Select columns
    params.push(`select=${this.selectCols}`);

    // Filters
    for (const f of this.filters) {
      params.push(`${f.column}=${f.operator}.${f.value}`);
    }

    // OR conditions (Must preserve literal parens and commas for PostgREST)
    for (const orCond of this.orClauses) {
      params.push(`or=${orCond}`);
    }

    // Order
    if (this.orderClauses.length > 0) {
      params.push(`order=${this.orderClauses.join(',')}`);
    }

    // Pagination
    if (this.limitCount !== undefined) {
      params.push(`limit=${this.limitCount}`);
    }
    if (this.offsetCount !== undefined) {
      params.push(`offset=${this.offsetCount}`);
    }

    return params.join('&');
  }

  async exec(): Promise<any> {
    // Check if query is scoped to an active demo session
    const cidFilter = this.filters.find(f => (f.column === 'clinic_id' || f.column === 'clinicId'));
    const idFilter = this.filters.find(f => (f.column === 'id' || f.column === '_id'));
    const demoSessionId = (cidFilter && DemoStore.isDemoSession(decodeURIComponent(String(cidFilter.value))))
      ? decodeURIComponent(String(cidFilter.value))
      : (idFilter && DemoStore.isDemoSession(decodeURIComponent(String(idFilter.value))) ? decodeURIComponent(String(idFilter.value)) : null);

    if (demoSessionId) {
      const filterObj: Record<string, any> = {};
      for (const f of this.filters) {
        const key = f.column === 'id' ? '_id' : f.column;
        let val: any = f.value;
        if (typeof val === 'string') {
          val = decodeURIComponent(val);
        }
        filterObj[key] = val;
      }
      const items = DemoStore.find(this.tableName, filterObj, demoSessionId);
      if (this.countOnly) {
        return items.length;
      }
      if (this.singleResult) {
        const item = items[0] || null;
        return item ? attachDocumentHelpers(mapObjectToCamel(item), this.tableName) : null;
      }
      return items.map(item => attachDocumentHelpers(mapObjectToCamel(item), this.tableName));
    }

    const queryString = this.buildQueryString();
    const endpoint = `/${this.tableName}?${queryString}`;
    const headers: Record<string, string> = {};

    if (this.countOnly) {
      headers['Prefer'] = 'count=exact';
      headers['Range'] = '0-0';
    }

    const { data, count } = await SupabaseClient.request(endpoint, {
      method: 'GET',
      headers
    });

    if (this.countOnly) {
      return count !== undefined ? count : (Array.isArray(data) ? data.length : 0);
    }

    if (this.singleResult) {
      const item = Array.isArray(data) ? (data[0] || null) : data;
      return item ? attachDocumentHelpers(mapObjectToCamel(item), this.tableName) : null;
    }

    const list = Array.isArray(data) ? data : (data ? [data] : []);
    return list.map(item => attachDocumentHelpers(mapObjectToCamel(item), this.tableName));
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<any | TResult> {
    return this.exec().catch(onrejected);
  }
}

/**
 * Attaches Mongoose-compatible helper functions (.save(), .toObject()) to returned entities
 */
export const attachDocumentHelpers = (doc: any, tableName: string) => {
  if (!doc || typeof doc !== 'object') return doc;

  Object.defineProperty(doc, 'save', {
    enumerable: false,
    writable: true,
    value: async function () {
      const docId = this.id || this._id;
      if (!docId) throw new Error(`Cannot save document without id`);
      const snakeData = mapObjectToSnake(this);
      delete snakeData.id;
      delete snakeData._id;
      delete snakeData.created_at;
      // Guarantee immutable clinic_id on existing record updates
      delete snakeData.clinic_id;

      let patchUrl = `/${tableName}?id=eq.${encodeURIComponent(docId)}`;
      const cid = this.clinicId || this.clinic_id;
      if (cid) {
        patchUrl += `&clinic_id=eq.${encodeURIComponent(cid)}`;
      }

      const { data } = await SupabaseClient.request(patchUrl, {
        method: 'PATCH',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify(snakeData)
      });
      const updated = Array.isArray(data) ? data[0] : data;
      if (updated) {
        Object.assign(this, mapObjectToCamel(updated));
      }
      return this;
    }
  });

  Object.defineProperty(doc, 'toObject', {
    enumerable: false,
    writable: true,
    value: function () {
      return { ...this };
    }
  });

  return doc;
};

/**
 * Generic Supabase Repository mimicking Mongoose Model interface
 */
export class SupabaseRepository<T = any> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  find(filter: Record<string, any> = {}): SupabaseQuery<T[]> {
    const q = new SupabaseQuery<T[]>(this.tableName);
    return q.where(filter);
  }

  findOne(filter: Record<string, any> = {}): SupabaseQuery<T | null> {
    if (filter.code === 'demo-clinic' && !filter.clinicId && !filter.clinic_id) {
      const q = new SupabaseQuery<T | null>(this.tableName);
      return q.where({ code: 'demo-clinic', clinicId: 'demo-clinic' }).limit(1).single();
    }
    const q = new SupabaseQuery<T | null>(this.tableName);
    return q.where(filter).limit(1).single();
  }

  findById(id: string | any, clinicId?: string): SupabaseQuery<T | null> {
    const cleanId = id?.toString() || '';
    const q = new SupabaseQuery<T | null>(this.tableName);
    const filter: Record<string, any> = { id: cleanId };
    if (clinicId) {
      filter.clinicId = clinicId;
    } else if (DemoStore.isDemoSession(cleanId)) {
      filter.clinicId = cleanId;
    }
    return q.where(filter).limit(1).single();
  }

  async countDocuments(filter: Record<string, any> = {}): Promise<number> {
    const q = new SupabaseQuery<number>(this.tableName);
    return q.where(filter).count().exec();
  }

  async create(data: any, clinicId?: string): Promise<any> {
    if (Array.isArray(data)) {
      return this.insertMany(data, clinicId);
    }

    const cid = clinicId || data.clinicId || data.clinic_id;
    if (DemoStore.isDemoSession(cid)) {
      const created = DemoStore.create(this.tableName, data, cid!);
      return attachDocumentHelpers(mapObjectToCamel(created), this.tableName);
    }

    const snakeData = mapObjectToSnake(data);
    if (!snakeData.id && snakeData._id) {
      snakeData.id = snakeData._id;
      delete snakeData._id;
    }

    if (clinicId) {
      snakeData.clinic_id = clinicId;
    }

    if (TENANT_TABLES.has(this.tableName) && !snakeData.clinic_id) {
      throw new Error(`[Tenant Isolation Error] Record creation in table '${this.tableName}' requires a valid clinic_id`);
    }

    const { data: result } = await SupabaseClient.request(`/${this.tableName}`, {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(snakeData)
    });

    const created = Array.isArray(result) ? result[0] : result;
    return attachDocumentHelpers(mapObjectToCamel(created), this.tableName);
  }

  async insertMany(items: any[], clinicId?: string): Promise<any[]> {
    if (items.length > 0) {
      const firstCid = clinicId || items[0].clinicId || items[0].clinic_id;
      if (DemoStore.isDemoSession(firstCid)) {
        return items.map(item => {
          const created = DemoStore.create(this.tableName, item, firstCid!);
          return attachDocumentHelpers(mapObjectToCamel(created), this.tableName);
        });
      }
    }

    const snakeItems = items.map(item => {
      const s = mapObjectToSnake(item);
      if (clinicId) {
        s.clinic_id = clinicId;
      }
      if (TENANT_TABLES.has(this.tableName) && !s.clinic_id) {
        throw new Error(`[Tenant Isolation Error] Record creation in table '${this.tableName}' requires a valid clinic_id`);
      }
      return s;
    });

    const { data: result } = await SupabaseClient.request(`/${this.tableName}`, {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(snakeItems)
    });

    const list = Array.isArray(result) ? result : [result];
    return list.map(item => attachDocumentHelpers(mapObjectToCamel(item), this.tableName));
  }

  async findByIdAndUpdate(id: string | any, update: any, options: { new?: boolean; runValidators?: boolean } = {}, clinicId?: string): Promise<any> {
    const cleanId = id?.toString() || '';
    const cid = clinicId || (DemoStore.isDemoSession(cleanId) ? cleanId : null);
    if (DemoStore.isDemoSession(cid)) {
      const updated = DemoStore.findByIdAndUpdate(this.tableName, cleanId, update, cid!);
      return updated ? attachDocumentHelpers(mapObjectToCamel(updated), this.tableName) : null;
    }

    const rawUpdate = update.$set ? { ...update, ...update.$set } : update;
    delete rawUpdate.$set;

    const snakeData = mapObjectToSnake(rawUpdate);
    delete snakeData.id;
    delete snakeData._id;
    delete snakeData.created_at;
    delete snakeData.clinic_id; // Ensure tenant ownership cannot be changed

    let patchUrl = `/${this.tableName}?id=eq.${encodeURIComponent(cleanId)}`;
    if (clinicId) {
      patchUrl += `&clinic_id=eq.${encodeURIComponent(clinicId)}`;
    }

    const { data } = await SupabaseClient.request(patchUrl, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(snakeData)
    });

    const updated = Array.isArray(data) ? data[0] : data;
    return updated ? attachDocumentHelpers(mapObjectToCamel(updated), this.tableName) : null;
  }

  async findOneAndUpdate(filter: Record<string, any>, update: any, options: { new?: boolean; runValidators?: boolean } = {}): Promise<any> {
    const existing = await this.findOne(filter);
    if (!existing) return null;

    const docId = existing.id || existing._id;
    const cid = filter.clinicId || filter.clinic_id || existing.clinicId;
    return this.findByIdAndUpdate(docId, update, options, cid);
  }

  async findOneAndDelete(filter: Record<string, any>): Promise<any> {
    const existing = await this.findOne(filter);
    if (!existing) return null;

    const docId = existing.id || existing._id;
    const cid = filter.clinicId || filter.clinic_id || existing.clinicId;
    if (DemoStore.isDemoSession(cid)) {
      return DemoStore.findByIdAndDelete(this.tableName, docId, cid!);
    }

    let delUrl = `/${this.tableName}?id=eq.${encodeURIComponent(docId)}`;
    if (cid) {
      delUrl += `&clinic_id=eq.${encodeURIComponent(cid)}`;
    }

    await SupabaseClient.request(delUrl, {
      method: 'DELETE',
      headers: { 'Prefer': 'return=representation' }
    });

    return existing;
  }

  async deleteMany(filter: Record<string, any>): Promise<{ deletedCount: number }> {
    const items = await this.find(filter);
    if (!items || items.length === 0) return { deletedCount: 0 };

    for (const item of items) {
      const docId = item.id || item._id;
      const cid = filter.clinicId || filter.clinic_id || item.clinicId;
      if (docId) {
        if (DemoStore.isDemoSession(cid)) {
          DemoStore.findByIdAndDelete(this.tableName, docId, cid!);
          continue;
        }
        let delUrl = `/${this.tableName}?id=eq.${encodeURIComponent(docId)}`;
        if (cid) {
          delUrl += `&clinic_id=eq.${encodeURIComponent(cid)}`;
        }
        await SupabaseClient.request(delUrl, {
          method: 'DELETE'
        });
      }
    }
    return { deletedCount: items.length };
  }

  async updateMany(filter: Record<string, any>, update: any): Promise<{ modifiedCount: number }> {
    const items = await this.find(filter);
    if (!items || items.length === 0) return { modifiedCount: 0 };

    for (const item of items) {
      const docId = item.id || item._id;
      const cid = filter.clinicId || filter.clinic_id || item.clinicId;
      if (docId) {
        await this.findByIdAndUpdate(docId, update, {}, cid);
      }
    }
    return { modifiedCount: items.length };
  }
}


