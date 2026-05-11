import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { HelperPermissionsDto } from '../auth/models/helper-permissions.model';
import { UserRole } from '../auth/models/role.model';
import { PagedResult } from './paged-result.model';

export interface HelperResponse {
  id: string;
  username: string;
  email: string | null;
  isBlocked: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  permissions: HelperPermissionsDto;
}

export interface CreateHelperPayload {
  username: string;
  password: string;
  email?: string | null;
  permissions: HelperPermissionsDto;
}

export interface AdminUserListItem {
  id: string;
  username: string;
  email: string | null;
  role: UserRole;
  ownerUserId: string | null;
  isBlocked: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class HelpersApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/users/me/helpers`;

  list(skip = 0, take = 50): Observable<PagedResult<HelperResponse>> {
    const params = new HttpParams().set('skip', skip).set('take', take);
    return this.http.get<PagedResult<HelperResponse>>(this.base, { params });
  }

  create(body: CreateHelperPayload): Observable<HelperResponse> {
    return this.http.post<HelperResponse>(this.base, body);
  }

  updatePermissions(id: string, permissions: HelperPermissionsDto): Observable<HelperResponse> {
    return this.http.patch<HelperResponse>(`${this.base}/${id}/permissions`, { permissions });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class AdminUsersApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/admin/users`;

  list(skip = 0, take = 50, role?: UserRole): Observable<PagedResult<AdminUserListItem>> {
    let params = new HttpParams().set('skip', skip).set('take', take);
    if (role) params = params.set('role', role);
    return this.http.get<PagedResult<AdminUserListItem>>(this.base, { params });
  }

  block(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/block`, {});
  }

  unblock(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/unblock`, {});
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
