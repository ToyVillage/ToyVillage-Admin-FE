export type {
  Resource,
  ResourceFile,
  FileType,
  DocumentType,
  CreateResourceInput,
  UpdateResourceInput,
} from './model/types'
export { fileTypeToDocumentType, documentTypeToFileType } from './model/types'
export { createDocument } from './api/createDocument'
export type {
  CreateDocumentRequest,
  CreateDocumentResponse,
} from './api/createDocument'
export { getDocuments, getDocument } from './api/getDocuments'
export type {
  DocumentsQueryAllRequest,
  DocumentOrderDirection,
  DocumentQueryRequest,
} from './api/getDocuments'
export { updateDocument } from './api/updateDocument'
export type {
  UpdateDocumentRequest,
  UpdateDocumentResponse,
} from './api/updateDocument'
export { deleteDocument } from './api/deleteDocument'
export type { DeleteDocumentResponse } from './api/deleteDocument'
export {
  mockResources,
  fileTypeTabs,
  tabToFileType,
  fileTypeLabel,
  resourceCategories,
  resourceStorageKey,
  deletedResourceStorageKey,
  getMockResources,
  getMockResource,
  createMockResource,
  updateMockResource,
  deleteMockResource,
} from './model/mock'
export { ResourceTable } from './ui/ResourceTable'
