import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Layers, 
  Cpu, 
  FileText, 
  Search, 
  Bookmark, 
  Clock, 
  Shield, 
  LogOut, 
  User, 
  Menu, 
  X, 
  ChevronRight, 
  ChevronDown, 
  Sliders, 
  Sparkles, 
  Zap, 
  Activity, 
  ExternalLink,
  PlusCircle,
  Database,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AdminDashboard } from './components/AdminDashboard';
import { BoardviewViewer } from './components/BoardviewViewer';
import { 
  getBrands, 
  getSeriesByBrand, 
  getModelsBySeries, 
  getBoardsByModel, 
  getComponentsByBoard, 
  getConnectionsByBoard, 
  getSchematicsByModel,
  getUserFavorites,
  toggleFavorite,
  getUserHistory,
  addHistoryItem
} from './lib/dbService';
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
} from './types';

export default function App() {
  const { user, profile, isAdmin, isTechnician, signOut, loading: authLoading } = useAuth();

  // Modals & Navigation
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'EXPLORER' | 'ADMIN' | 'FAVORITES' | 'HISTORY'>('EXPLORER');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Hierarchy Navigation State
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);

  const [models, setModels] = useState<DeviceModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<DeviceModel | null>(null);

  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

  // Active Board Data
  const [components, setComponents] = useState<BoardComponent[]>([]);
  const [connections, setConnections] = useState<ConnectionNet[]>([]);
  const [schematics, setSchematics] = useState<SchematicDoc[]>([]);

  // Boardview interactive selections
  const [selectedComponent, setSelectedComponent] = useState<BoardComponent | null>(null);
  const [selectedNet, setSelectedNet] = useState<ConnectionNet | null>(null);

  // User saved
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [historyItems, setHistoryItems] = useState<UserHistoryItem[]>([]);
  const [isCurrentModelFav, setIsCurrentModelFav] = useState(false);

  // Loading states
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingBoard, setLoadingBoard] = useState(false);

  // Active Center Tab: Boardview or Schematics PDF viewer
  const [viewerMode, setViewerMode] = useState<'BOARDVIEW' | 'SCHEMATICS'>('BOARDVIEW');
  const [activeSchematicDoc, setActiveSchematicDoc] = useState<SchematicDoc | null>(null);

  // 1. Initial Load Brands
  useEffect(() => {
    getBrands().then(data => {
      setBrands(data);
      setLoadingBrands(false);
    });
  }, []);

  // 2. Load Series when Brand Selected
  useEffect(() => {
    if (selectedBrand) {
      getSeriesByBrand(selectedBrand.id).then(setSeriesList);
      setSelectedSeries(null);
      setModels([]);
      setSelectedModel(null);
      setSelectedBoard(null);
    } else {
      setSeriesList([]);
    }
  }, [selectedBrand]);

  // 3. Load Models when Series Selected
  useEffect(() => {
    if (selectedSeries) {
      setLoadingModels(true);
      getModelsBySeries(selectedSeries.id).then(data => {
        setModels(data);
        setLoadingModels(false);
      });
      setSelectedModel(null);
      setSelectedBoard(null);
    } else {
      setModels([]);
    }
  }, [selectedSeries]);

  // 4. Load Boards & Schematics when Model Selected
  useEffect(() => {
    if (selectedModel) {
      getBoardsByModel(selectedModel.id).then(bData => {
        setBoards(bData);
        if (bData.length > 0) {
          setSelectedBoard(bData[0]);
        } else {
          setSelectedBoard(null);
        }
      });
      getSchematicsByModel(selectedModel.id).then(sData => {
        setSchematics(sData);
        if (sData.length > 0) {
          setActiveSchematicDoc(sData[0]);
        } else {
          setActiveSchematicDoc(null);
        }
      });

      // Check if favorited
      if (user) {
        getUserFavorites(user.uid).then(favs => {
          setFavorites(favs);
          setIsCurrentModelFav(favs.some(f => f.targetId === selectedModel.id));
        });
      }
    }
  }, [selectedModel, user]);

  // 5. Load Board Details (Components & Connections)
  useEffect(() => {
    if (selectedBoard) {
      setLoadingBoard(true);
      Promise.all([
        getComponentsByBoard(selectedBoard.id),
        getConnectionsByBoard(selectedBoard.id)
      ]).then(([comps, nets]) => {
        setComponents(comps);
        setConnections(nets);
        setLoadingBoard(false);

        // Record History for user
        if (user && selectedModel && selectedBrand) {
          addHistoryItem({
            userId: user.uid,
            modelId: selectedModel.id,
            modelName: selectedModel.name,
            brandName: selectedBrand.name,
            boardId: selectedBoard.id,
            boardName: selectedBoard.name,
          });
        }
      });
    } else {
      setComponents([]);
      setConnections([]);
    }
  }, [selectedBoard, user]);

  // Refresh favorites / history when tab switched
  useEffect(() => {
    if (user && currentView === 'FAVORITES') {
      getUserFavorites(user.uid).then(setFavorites);
    }
    if (user && currentView === 'HISTORY') {
      getUserHistory(user.uid).then(setHistoryItems);
    }
  }, [currentView, user]);

  // Handle Global Search Result Click
  const handleSearchResult = async (result: GlobalSearchResult) => {
    setCurrentView('EXPLORER');
    // If result has a boardId, locate it
    if (result.boardId) {
      // Find board
      const bList = await getBoardsByModel(result.id);
      // or if it's a component
      if (result.componentRef) {
        // select component
      }
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !selectedModel) {
      setIsAuthOpen(true);
      return;
    }
    const added = await toggleFavorite(user.uid, {
      type: 'MODEL',
      targetId: selectedModel.id,
      title: selectedModel.name,
      subtitle: selectedModel.modelCode,
      brandName: selectedBrand?.name,
    });
    setIsCurrentModelFav(added);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleSearchResult}
      />

      {/* Top Application Bar */}
      <div className="fixed top-0 inset-x-0 h-14 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-40 flex items-center justify-between px-4">
        {/* Brand & Sidebar Toggle */}
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
            title="إظهار / إخفاء القائمة الجانبية"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => setCurrentView('EXPLORER')}
            className="flex items-center space-x-2 space-x-reverse cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-600/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-wide bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent group-hover:opacity-90">
                VoltFix Pro
              </span>
              <span className="hidden sm:inline-block text-[10px] text-slate-400 mr-2 border border-slate-700/80 px-1.5 py-0.2 rounded">
                منصة مخططات الصيانة
              </span>
            </div>
          </div>
        </div>

        {/* Global Quick Search Bar Button */}
        <div className="flex-1 max-w-lg mx-4">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 px-3.5 py-1.5 rounded-xl text-xs transition"
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <Search className="w-4 h-4 text-cyan-400 ml-1.5" />
              <span>بحث عن جهاز، IC، كود الموديل، مسار Net، أو نقطة فحص...</span>
            </div>
            <kbd className="hidden sm:inline-block bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-400 border border-slate-700">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right Navigation & Profile */}
        <div className="flex items-center space-x-2 space-x-reverse">
          {isAdmin && (
            <button
              onClick={() => setCurrentView(currentView === 'ADMIN' ? 'EXPLORER' : 'ADMIN')}
              className={`flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                currentView === 'ADMIN'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Database className="w-3.5 h-3.5 ml-1 text-cyan-400" />
              <span>لوحة التحكم (Admin)</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={() => setCurrentView('FAVORITES')}
                className={`p-2 rounded-lg text-slate-400 hover:text-white transition ${
                  currentView === 'FAVORITES' ? 'bg-slate-800 text-amber-400' : 'hover:bg-slate-800'
                }`}
                title="المفضلة"
              >
                <Bookmark className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentView('HISTORY')}
                className={`p-2 rounded-lg text-slate-400 hover:text-white transition ${
                  currentView === 'HISTORY' ? 'bg-slate-800 text-cyan-400' : 'hover:bg-slate-800'
                }`}
                title="سجل التصفح"
              >
                <Clock className="w-4 h-4" />
              </button>

              <div className="h-5 w-px bg-slate-800" />

              <div className="flex items-center space-x-2 space-x-reverse bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                <div className="w-6 h-6 rounded-full bg-cyan-600/30 text-cyan-300 flex items-center justify-center text-xs font-bold">
                  {profile?.displayName?.slice(0, 1) || 'ف'}
                </div>
                <div className="hidden md:block text-right">
                  <div className="text-xs font-semibold text-white leading-tight">{profile?.displayName || 'فني'}</div>
                  <div className="text-[10px] text-cyan-400 leading-tight">
                    {profile?.role === 'admin' ? 'مدير المنصة' : 'فني معتمد'}
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="text-slate-400 hover:text-rose-400 p-1 mr-1"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition shadow-md shadow-cyan-600/20"
            >
              تسجيل الدخول
            </button>
          )}
        </div>
      </div>

      {/* Main App Layout */}
      <div className="flex w-full h-full pt-14 overflow-hidden">
        {/* Left Hierarchical Device Navigation Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-80' : 'w-0'
          } bg-slate-900 border-l border-slate-800 flex-shrink-0 transition-all duration-300 flex flex-col overflow-hidden z-30`}
        >
          {/* Sidebar Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-slate-300">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>دليل الأجهزة والموديلات</span>
            </div>
            {isAdmin && (
              <button
                onClick={() => setCurrentView('ADMIN')}
                className="text-[10px] text-cyan-400 hover:underline flex items-center"
              >
                <PlusCircle className="w-3 h-3 ml-1" />
                إضافة جهاز
              </button>
            )}
          </div>

          {/* Drilldown Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Step 1: Select Brand */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                1. الشركات المصنعة (Brands)
              </div>
              {loadingBrands ? (
                <div className="py-4 text-center text-xs text-slate-500">جارٍ التحميل...</div>
              ) : brands.length === 0 ? (
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500">
                  لا توجد شركات مضافة بعد.
                  {isAdmin && (
                    <button
                      onClick={() => setCurrentView('ADMIN')}
                      className="block mx-auto mt-2 text-cyan-400 underline font-semibold"
                    >
                      أضف شركة من لوحة التحكم
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {brands.map(b => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBrand(b)}
                      className={`p-2.5 rounded-lg border text-right transition flex items-center space-x-2 space-x-reverse ${
                        selectedBrand?.id === b.id
                          ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      {b.logoUrl ? (
                        <img src={b.logoUrl} alt={b.name} className="w-5 h-5 object-contain rounded ml-2" />
                      ) : (
                        <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-[10px] font-bold text-cyan-400 ml-2">
                          {b.name.slice(0, 1)}
                        </div>
                      )}
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{b.name}</div>
                        {b.nameAr && <div className="text-[10px] text-slate-400 truncate">{b.nameAr}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Select Series */}
            {selectedBrand && (
              <div className="animate-fadeIn">
                <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center justify-between">
                  <span>2. السلسلة ({selectedBrand.name})</span>
                  <button onClick={() => setSelectedBrand(null)} className="text-[10px] text-cyan-400 hover:underline">
                    تغيير
                  </button>
                </div>
                {seriesList.length === 0 ? (
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-500 text-center">
                    لا توجد سلاسل لهذه الشركة.
                    {isAdmin && (
                      <button onClick={() => setCurrentView('ADMIN')} className="block mx-auto mt-1 text-cyan-400 underline">
                        أضف سلسلة جديدة
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {seriesList.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSeries(s)}
                        className={`w-full p-2.5 rounded-lg border text-right transition flex items-center justify-between text-xs ${
                          selectedSeries?.id === s.id
                            ? 'bg-indigo-950/50 border-indigo-500 text-white font-bold'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-950'
                        }`}
                      >
                        <span>{s.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Select Model */}
            {selectedSeries && (
              <div className="animate-fadeIn">
                <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center justify-between">
                  <span>3. الموديل والجهاز</span>
                  <button onClick={() => setSelectedSeries(null)} className="text-[10px] text-cyan-400 hover:underline">
                    تغيير
                  </button>
                </div>
                {loadingModels ? (
                  <div className="py-3 text-center text-xs text-slate-500">جارٍ تحميل الموديلات...</div>
                ) : models.length === 0 ? (
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-500 text-center">
                    لا توجد موديلات في هذه السلسلة.
                    {isAdmin && (
                      <button onClick={() => setCurrentView('ADMIN')} className="block mx-auto mt-1 text-cyan-400 underline">
                        أضف موديل جديد
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {models.map(m => (
                      <div
                        key={m.id}
                        onClick={() => setSelectedModel(m)}
                        className={`p-3 rounded-xl border text-right cursor-pointer transition ${
                          selectedModel?.id === m.id
                            ? 'bg-slate-800 border-cyan-500 shadow-md'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2 space-x-reverse justify-between">
                          <span className="font-bold text-xs text-white">{m.name}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800">
                            {m.modelCode}
                          </span>
                        </div>
                        {m.releaseYear && (
                          <div className="text-[10px] text-slate-500 mt-1">سنة الإصدار: {m.releaseYear}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Center Main Work Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
          {/* ADMIN VIEW */}
          {currentView === 'ADMIN' && <AdminDashboard />}

          {/* FAVORITES VIEW */}
          {currentView === 'FAVORITES' && (
            <div className="p-6 overflow-y-auto max-w-4xl mx-auto w-full">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center">
                <Bookmark className="w-5 h-5 text-amber-400 ml-2" />
                المخططات والأجهزة المفضلة
              </h2>
              <p className="text-xs text-slate-400 mb-6">قائمتك السريعة للرجوع للأجهزة التي تعمل عليها بشكل متكرر.</p>
              {favorites.length === 0 ? (
                <div className="p-8 text-center text-slate-500 border border-slate-800 rounded-xl bg-slate-900/40 text-xs">
                  لم تقم بحفظ أي أجهزة في المفضلة بعد. انقر على أيقونة النجمة أو الحفظ عند فتح أي موديل.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {favorites.map(fav => (
                    <div
                      key={fav.id}
                      className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between hover:border-cyan-500/50 transition cursor-pointer"
                      onClick={() => {
                        // Open this model
                        setCurrentView('EXPLORER');
                      }}
                    >
                      <div>
                        <div className="font-bold text-sm text-white">{fav.title}</div>
                        <div className="text-xs text-cyan-400 font-mono mt-0.5">{fav.subtitle}</div>
                        {fav.brandName && <div className="text-[11px] text-slate-500 mt-1">الشركة: {fav.brandName}</div>}
                      </div>
                      <ChevronLeft className="w-5 h-5 text-slate-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HISTORY VIEW */}
          {currentView === 'HISTORY' && (
            <div className="p-6 overflow-y-auto max-w-4xl mx-auto w-full">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center">
                <Clock className="w-5 h-5 text-cyan-400 ml-2" />
                سجل المخططات التي تم فتحها مؤخراً
              </h2>
              <p className="text-xs text-slate-400 mb-6">سجل التصفح يتيح لك استرجاع البوردات السابقة بنقرة واحدة.</p>
              {historyItems.length === 0 ? (
                <div className="p-8 text-center text-slate-500 border border-slate-800 rounded-xl bg-slate-900/40 text-xs">
                  لا يوجد سجل تصفح بعد.
                </div>
              ) : (
                <div className="space-y-3">
                  {historyItems.map(item => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between hover:border-cyan-500/50 transition cursor-pointer"
                      onClick={() => {
                        setCurrentView('EXPLORER');
                      }}
                    >
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <Cpu className="w-5 h-5 text-cyan-400 ml-2" />
                        <div>
                          <div className="font-bold text-xs text-white">{item.modelName} - {item.boardName}</div>
                          <div className="text-[11px] text-slate-400">{item.brandName}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(item.viewedAt).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* EXPLORER / BOARDVIEW VIEW */}
          {currentView === 'EXPLORER' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Selected Model Details Subheader */}
              {selectedModel ? (
                <div className="bg-slate-900/70 border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <h2 className="text-base font-bold text-white">{selectedModel.name}</h2>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                          {selectedModel.modelCode}
                        </span>
                        <button
                          onClick={handleToggleFavorite}
                          className={`p-1 rounded text-sm transition ${
                            isCurrentModelFav ? 'text-amber-400' : 'text-slate-500 hover:text-white'
                          }`}
                          title={isCurrentModelFav ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                        >
                          <Bookmark className={`w-4 h-4 ${isCurrentModelFav ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {selectedBrand?.name} &gt; {selectedSeries?.name}
                      </div>
                    </div>

                    {/* Board Selector Tabs if multiple boards exist */}
                    {boards.length > 1 && (
                      <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 mr-4">
                        {boards.map(b => (
                          <button
                            key={b.id}
                            onClick={() => setSelectedBoard(b)}
                            className={`px-3 py-1 text-xs rounded-md transition ${
                              selectedBoard?.id === b.id
                                ? 'bg-cyan-600 text-white font-semibold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {b.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mode switcher: Boardview vs Schematics PDF */}
                  <div className="flex items-center space-x-1.5 space-x-reverse bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setViewerMode('BOARDVIEW')}
                      className={`flex items-center space-x-1 space-x-reverse px-3 py-1 text-xs font-semibold rounded-md transition ${
                        viewerMode === 'BOARDVIEW'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Cpu className="w-3.5 h-3.5 ml-1" />
                      <span>مخطط البوردة التفاعلي (Boardview)</span>
                    </button>
                    <button
                      onClick={() => setViewerMode('SCHEMATICS')}
                      className={`flex items-center space-x-1 space-x-reverse px-3 py-1 text-xs font-semibold rounded-md transition ${
                        viewerMode === 'SCHEMATICS'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 ml-1" />
                      <span>مخططات الدوائر والـ PDFs ({schematics.length})</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty state when no model is selected yet */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-950/40 border border-cyan-800/50 flex items-center justify-center text-cyan-400 mb-4 shadow-xl shadow-cyan-950/50">
                    <Cpu className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">اختر هاتفاً لعرض البوردة والمخططات الفنية</h3>
                  <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                    استخدم القائمة الجانبية لتحديد الشركة المصنعة ثم السلسلة ثم موديل الجهاز، أو استخدم محرك البحث المباشر للوصول السريع إلى أي مكون أو مسار.
                  </p>

                  <div className="flex items-center space-x-3 space-x-reverse">
                    <button
                      onClick={() => setIsSearchOpen(true)}
                      className="flex items-center space-x-2 space-x-reverse bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold transition"
                    >
                      <Search className="w-4 h-4 ml-1.5 text-cyan-400" />
                      <span>فتح البحث الشامل (Ctrl+K)</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => setCurrentView('ADMIN')}
                        className="flex items-center space-x-2 space-x-reverse bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
                      >
                        <PlusCircle className="w-4 h-4 ml-1.5" />
                        <span>إضافة جهاز جديد للوحة التحكم</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Viewer Container */}
              {selectedModel && (
                <div className="flex-1 p-3 overflow-hidden">
                  {viewerMode === 'BOARDVIEW' ? (
                    selectedBoard ? (
                      <BoardviewViewer
                        board={selectedBoard}
                        components={components}
                        connections={connections}
                        selectedComponentProp={selectedComponent}
                        onSelectComponent={setSelectedComponent}
                        onSelectNet={setSelectedNet}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center border border-slate-800 rounded-xl bg-slate-900/30 text-xs text-slate-500">
                        لم يتم ربط بوردة (Motherboard) لهذا الجهاز بعد.
                        {isAdmin && (
                          <button onClick={() => setCurrentView('ADMIN')} className="text-cyan-400 underline font-semibold mr-1">
                            أضف بوردة الآن
                          </button>
                        )}
                      </div>
                    )
                  ) : (
                    /* Schematics PDF Reader / Viewer Mode */
                    <div className="h-full flex flex-col md:flex-row gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-hidden">
                      {/* Left list of schematics documents */}
                      <div className="w-full md:w-72 flex-shrink-0 border-b md:border-b-0 md:border-l border-slate-800 pl-0 md:pl-4 overflow-y-auto">
                        <div className="text-xs font-bold text-white mb-3">ملفات المخططات المتاحة</div>
                        {schematics.length === 0 ? (
                          <div className="text-xs text-slate-500 py-6 text-center">
                            لا توجد ملفات PDF مسجلة لهذا الموديل.
                            {isAdmin && (
                              <button onClick={() => setCurrentView('ADMIN')} className="block mx-auto mt-2 text-cyan-400 underline">
                                إضافة ملف مخطط
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {schematics.map(sDoc => (
                              <div
                                key={sDoc.id}
                                onClick={() => setActiveSchematicDoc(sDoc)}
                                className={`p-3 rounded-lg border text-right cursor-pointer transition ${
                                  activeSchematicDoc?.id === sDoc.id
                                    ? 'bg-cyan-950/60 border-cyan-500 text-white'
                                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                                }`}
                              >
                                <div className="text-xs font-bold">{sDoc.title}</div>
                                <div className="text-[10px] text-cyan-400 mt-1">{sDoc.category}</div>
                                {sDoc.pageCount && <div className="text-[10px] text-slate-500">{sDoc.pageCount} صفحة</div>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right PDF frame / Document preview */}
                      <div className="flex-1 flex flex-col h-full bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                        {activeSchematicDoc ? (
                          <div className="h-full flex flex-col">
                            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                              <span className="font-bold text-white">{activeSchematicDoc.title}</span>
                              <a
                                href={activeSchematicDoc.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center space-x-1 space-x-reverse text-cyan-400 hover:underline"
                              >
                                <span>فتح في نافذة كاملة</span>
                                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                              </a>
                            </div>
                            <iframe
                              src={activeSchematicDoc.fileUrl}
                              className="flex-1 w-full h-full border-none"
                              title={activeSchematicDoc.title}
                            />
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-xs text-slate-500">
                            اختر ملف مخطط لعرضه.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
