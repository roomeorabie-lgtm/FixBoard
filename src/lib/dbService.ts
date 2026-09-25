import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Brand, 
  Series, 
  DeviceModel, 
  Board, 
  BoardComponent, 
  ConnectionNet, 
  SchematicDoc, 
  UserFavorite, 
  UserHistoryItem,
  GlobalSearchResult 
} from '../types';

// ============ BRANDS ============
export const getBrands = async (): Promise<Brand[]> => {
  const q = query(collection(db, 'brands'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Brand));
};

export const addBrand = async (brandData: Omit<Brand, 'id' | 'createdAt'>): Promise<string> => {
  const ref = doc(collection(db, 'brands'));
  const newBrand: Brand = {
    ...brandData,
    id: ref.id,
    createdAt: Date.now(),
  };
  await setDoc(ref, newBrand);
  return ref.id;
};

export const updateBrand = async (id: string, data: Partial<Brand>): Promise<void> => {
  await updateDoc(doc(db, 'brands', id), data);
};

export const deleteBrand = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'brands', id));
};

// ============ SERIES ============
export const getSeriesByBrand = async (brandId: string): Promise<Series[]> => {
  const q = query(
    collection(db, 'series'), 
    where('brandId', '==', brandId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Series));
};

export const getAllSeries = async (): Promise<Series[]> => {
  const snap = await getDocs(collection(db, 'series'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Series));
};

export const addSeries = async (seriesData: Omit<Series, 'id' | 'createdAt'>): Promise<string> => {
  const ref = doc(collection(db, 'series'));
  const newSeries: Series = {
    ...seriesData,
    id: ref.id,
    createdAt: Date.now(),
  };
  await setDoc(ref, newSeries);
  return ref.id;
};

export const updateSeries = async (id: string, data: Partial<Series>): Promise<void> => {
  await updateDoc(doc(db, 'series', id), data);
};

export const deleteSeries = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'series', id));
};

// ============ DEVICE MODELS ============
export const getModelsBySeries = async (seriesId: string): Promise<DeviceModel[]> => {
  const q = query(
    collection(db, 'models'), 
    where('seriesId', '==', seriesId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as DeviceModel));
};

export const getAllModels = async (): Promise<DeviceModel[]> => {
  const snap = await getDocs(collection(db, 'models'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as DeviceModel));
};

export const getModelById = async (id: string): Promise<DeviceModel | null> => {
  const snap = await getDoc(doc(db, 'models', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as DeviceModel;
};

export const addModel = async (modelData: Omit<DeviceModel, 'id' | 'createdAt'>): Promise<string> => {
  const ref = doc(collection(db, 'models'));
  const newModel: DeviceModel = {
    ...modelData,
    id: ref.id,
    createdAt: Date.now(),
  };
  await setDoc(ref, newModel);
  return ref.id;
};

export const updateModel = async (id: string, data: Partial<DeviceModel>): Promise<void> => {
  await updateDoc(doc(db, 'models', id), data);
};

export const deleteModel = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'models', id));
};

// ============ BOARDS ============
export const getBoardsByModel = async (modelId: string): Promise<Board[]> => {
  const q = query(
    collection(db, 'boards'), 
    where('modelId', '==', modelId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Board));
};

export const getBoardById = async (id: string): Promise<Board | null> => {
  const snap = await getDoc(doc(db, 'boards', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Board;
};

export const addBoard = async (boardData: Omit<Board, 'id' | 'createdAt'>): Promise<string> => {
  const ref = doc(collection(db, 'boards'));
  const newBoard: Board = {
    ...boardData,
    id: ref.id,
    createdAt: Date.now(),
  };
  await setDoc(ref, newBoard);
  return ref.id;
};

export const updateBoard = async (id: string, data: Partial<Board>): Promise<void> => {
  await updateDoc(doc(db, 'boards', id), data);
};

export const deleteBoard = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'boards', id));
};

// ============ COMPONENTS (Sub-collection of boardviews or global collection) ============
// We store components in top-level 'boardComponents' for easy querying and fast updates
export const getComponentsByBoard = async (boardId: string): Promise<BoardComponent[]> => {
  const q = query(
    collection(db, 'boardComponents'), 
    where('boardId', '==', boardId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as BoardComponent));
};

export const addComponent = async (componentData: Omit<BoardComponent, 'id'>): Promise<string> => {
  const ref = doc(collection(db, 'boardComponents'));
  const newComp: BoardComponent = {
    ...componentData,
    id: ref.id,
  };
  await setDoc(ref, newComp);
  return ref.id;
};

export const updateComponent = async (id: string, data: Partial<BoardComponent>): Promise<void> => {
  await updateDoc(doc(db, 'boardComponents', id), data);
};

export const deleteComponent = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'boardComponents', id));
};

// ============ CONNECTIONS / NETS ============
export const getConnectionsByBoard = async (boardId: string): Promise<ConnectionNet[]> => {
  const q = query(
    collection(db, 'boardNets'), 
    where('boardId', '==', boardId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ConnectionNet));
};

export const addConnectionNet = async (netData: Omit<ConnectionNet, 'id'>): Promise<string> => {
  const ref = doc(collection(db, 'boardNets'));
  const newNet: ConnectionNet = {
    ...netData,
    id: ref.id,
  };
  await setDoc(ref, newNet);
  return ref.id;
};

export const updateConnectionNet = async (id: string, data: Partial<ConnectionNet>): Promise<void> => {
  await updateDoc(doc(db, 'boardNets', id), data);
};

export const deleteConnectionNet = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'boardNets', id));
};

// ============ SCHEMATICS DOCS ============
export const getSchematicsByModel = async (modelId: string): Promise<SchematicDoc[]> => {
  const q = query(
    collection(db, 'schematics'), 
    where('modelId', '==', modelId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as SchematicDoc));
};

export const addSchematicDoc = async (docData: Omit<SchematicDoc, 'id' | 'createdAt'>): Promise<string> => {
  const ref = doc(collection(db, 'schematics'));
  const newDoc: SchematicDoc = {
    ...docData,
    id: ref.id,
    createdAt: Date.now(),
  };
  await setDoc(ref, newDoc);
  return ref.id;
};

export const deleteSchematicDoc = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'schematics', id));
};

// ============ FAVORITES & HISTORY ============
export const getUserFavorites = async (userId: string): Promise<UserFavorite[]> => {
  const q = query(
    collection(db, 'favorites'), 
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserFavorite));
};

export const toggleFavorite = async (
  userId: string, 
  item: Omit<UserFavorite, 'id' | 'createdAt' | 'userId'>
): Promise<boolean> => {
  // Check if exists
  const q = query(
    collection(db, 'favorites'), 
    where('userId', '==', userId),
    where('targetId', '==', item.targetId)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    // Delete
    await deleteDoc(doc(db, 'favorites', snap.docs[0].id));
    return false; // Removed
  } else {
    // Add
    const ref = doc(collection(db, 'favorites'));
    await setDoc(ref, {
      ...item,
      id: ref.id,
      userId,
      createdAt: Date.now(),
    });
    return true; // Added
  }
};

export const addHistoryItem = async (item: Omit<UserHistoryItem, 'id' | 'viewedAt'>): Promise<void> => {
  try {
    const q = query(
      collection(db, 'history'),
      where('userId', '==', item.userId),
      where('boardId', '==', item.boardId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(doc(db, 'history', snap.docs[0].id), {
        viewedAt: Date.now(),
      });
    } else {
      const ref = doc(collection(db, 'history'));
      await setDoc(ref, {
        ...item,
        id: ref.id,
        viewedAt: Date.now(),
      });
    }
  } catch (err) {
    console.error('Failed to log history', err);
  }
};

export const getUserHistory = async (userId: string): Promise<UserHistoryItem[]> => {
  const q = query(
    collection(db, 'history'),
    where('userId', '==', userId),
    orderBy('viewedAt', 'desc'),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserHistoryItem));
};

// ============ GLOBAL POWER SEARCH ============
export const searchEverything = async (queryTerm: string): Promise<GlobalSearchResult[]> => {
  const cleanTerm = queryTerm.trim().toUpperCase();
  if (!cleanTerm || cleanTerm.length < 2) return [];

  const results: GlobalSearchResult[] = [];

  try {
    // Search Models
    const modelsSnap = await getDocs(collection(db, 'models'));
    modelsSnap.forEach(d => {
      const data = d.data() as DeviceModel;
      if (
        data.name.toUpperCase().includes(cleanTerm) ||
        data.modelCode.toUpperCase().includes(cleanTerm)
      ) {
        results.push({
          type: 'MODEL',
          id: data.id,
          title: data.name,
          subtitle: `كود الموديل: ${data.modelCode}`,
          badge: 'جهاز / موديل',
          modelName: data.name,
        });
      }
    });

    // Search Components
    const compSnap = await getDocs(collection(db, 'boardComponents'));
    compSnap.forEach(d => {
      const data = d.data() as BoardComponent;
      if (
        data.refDes.toUpperCase().includes(cleanTerm) ||
        (data.name && data.name.toUpperCase().includes(cleanTerm)) ||
        (data.partNumber && data.partNumber.toUpperCase().includes(cleanTerm)) ||
        (data.description && data.description.toUpperCase().includes(cleanTerm))
      ) {
        results.push({
          type: data.type === 'IC' ? 'IC' : data.type === 'TEST_POINT' ? 'TEST_POINT' : 'COMPONENT',
          id: data.id,
          title: `${data.refDes} - ${data.name || data.type}`,
          subtitle: `القطعة: ${data.partNumber || data.value || ''} | الطبقة: ${data.layer}`,
          badge: data.refDes,
          boardId: data.boardId,
          componentRef: data.refDes,
        });
      }
    });

    // Search Nets / Lines
    const netsSnap = await getDocs(collection(db, 'boardNets'));
    netsSnap.forEach(d => {
      const data = d.data() as ConnectionNet;
      if (
        data.name.toUpperCase().includes(cleanTerm) ||
        (data.description && data.description.toUpperCase().includes(cleanTerm))
      ) {
        results.push({
          type: 'NET',
          id: data.id,
          title: data.name,
          subtitle: `مسار كهربائي: ${data.voltage || data.type} (${data.points?.length || 0} نقاط)`,
          badge: 'مسار Net',
          boardId: data.boardId,
          netName: data.name,
        });
      }
    });
  } catch (err) {
    console.error('Search error', err);
  }

  return results.slice(0, 30);
};
