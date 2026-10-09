import type { LocalizedText } from '../types.ts'

export interface HttpStatus {
  code: number
  phrase: string
  description: LocalizedText
}

export const HTTP_STATUSES: HttpStatus[] = [
  { code: 200, phrase: 'OK', description: { en: 'Standard success response.', zh: '请求成功。' } },
  { code: 201, phrase: 'Created', description: { en: 'Resource created.', zh: '资源已创建。' } },
  { code: 202, phrase: 'Accepted', description: { en: 'Accepted for processing.', zh: '已接受，正在处理。' } },
  { code: 204, phrase: 'No Content', description: { en: 'Success with no body.', zh: '成功但无内容。' } },
  { code: 206, phrase: 'Partial Content', description: { en: 'Range request fulfilled.', zh: '部分内容（断点续传）。' } },
  { code: 301, phrase: 'Moved Permanently', description: { en: 'Permanent redirect.', zh: '永久重定向。' } },
  { code: 302, phrase: 'Found', description: { en: 'Temporary redirect.', zh: '临时重定向。' } },
  { code: 304, phrase: 'Not Modified', description: { en: 'Cached copy is fresh.', zh: '缓存仍然有效。' } },
  { code: 307, phrase: 'Temporary Redirect', description: { en: 'Redirect preserving the method.', zh: '临时重定向，保留请求方法。' } },
  { code: 308, phrase: 'Permanent Redirect', description: { en: 'Permanent redirect preserving the method.', zh: '永久重定向，保留请求方法。' } },
  { code: 400, phrase: 'Bad Request', description: { en: 'Malformed request.', zh: '请求语法错误。' } },
  { code: 401, phrase: 'Unauthorized', description: { en: 'Authentication required.', zh: '需要身份认证。' } },
  { code: 403, phrase: 'Forbidden', description: { en: 'Authenticated but not allowed.', zh: '已认证但无权限。' } },
  { code: 404, phrase: 'Not Found', description: { en: 'Resource does not exist.', zh: '资源不存在。' } },
  { code: 405, phrase: 'Method Not Allowed', description: { en: 'Method not supported here.', zh: '方法不被允许。' } },
  { code: 408, phrase: 'Request Timeout', description: { en: 'Client took too long.', zh: '请求超时。' } },
  { code: 409, phrase: 'Conflict', description: { en: 'State conflict.', zh: '资源冲突。' } },
  { code: 410, phrase: 'Gone', description: { en: 'Permanently removed.', zh: '资源已永久移除。' } },
  { code: 413, phrase: 'Payload Too Large', description: { en: 'Body too large.', zh: '请求体过大。' } },
  { code: 418, phrase: "I'm a teapot", description: { en: 'April Fools joke (RFC 2324).', zh: '玩笑状态码（RFC 2324）。' } },
  { code: 422, phrase: 'Unprocessable Entity', description: { en: 'Semantic validation failed.', zh: '语义校验失败。' } },
  { code: 429, phrase: 'Too Many Requests', description: { en: 'Rate limited.', zh: '请求过于频繁（被限流）。' } },
  { code: 500, phrase: 'Internal Server Error', description: { en: 'Unexpected server error.', zh: '服务器内部错误。' } },
  { code: 501, phrase: 'Not Implemented', description: { en: 'Method not supported by server.', zh: '服务器未实现该方法。' } },
  { code: 502, phrase: 'Bad Gateway', description: { en: 'Invalid upstream response.', zh: '网关错误。' } },
  { code: 503, phrase: 'Service Unavailable', description: { en: 'Server overloaded or down.', zh: '服务不可用（过载或维护）。' } },
  { code: 504, phrase: 'Gateway Timeout', description: { en: 'Upstream timed out.', zh: '网关超时。' } },
]

export function categoryOf(code: number): { en: string; zh: string } {
  if (code < 200) return { en: 'Informational', zh: '信息' }
  if (code < 300) return { en: 'Success', zh: '成功' }
  if (code < 400) return { en: 'Redirect', zh: '重定向' }
  if (code < 500) return { en: 'Client error', zh: '客户端错误' }
  return { en: 'Server error', zh: '服务器错误' }
}

export function findStatus(query: string): HttpStatus[] {
  const q = query.trim().toLowerCase()
  if (!q) return HTTP_STATUSES
  return HTTP_STATUSES.filter(
    (s) => String(s.code).includes(q) || s.phrase.toLowerCase().includes(q),
  )
}
