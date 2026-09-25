import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Layers, 
  Smartphone, 
  Cpu, 
  Share2, 
  FileText, 
  Plus, 
  Trash2, 
  Edit2, 
  Eye, 
  Check, 
  AlertCircle, 
  BarChart3, 
  Users, 
  RefreshCw,
  Search,
  Upload,
  ArrowRight
} from 'lucide-react';
import { 
  getBrands, addBrand, updateBrand, deleteBrand,
  getAllSeries, addSeries, deleteSeries,
  getAllModels, addModel, deleteModel,
  getBoardsByModel, addBoard, deleteBoard,
  getComponentsByBoard, addComponent, deleteComponent,
  getConnectionsByBoard, addConnectionNet, deleteConnectionNet,
  addSchematicDoc, getSchematicsByModel, deleteSchematicDoc
} from '../lib/dbService';
import { Brand, Series, DeviceModel, Board, BoardComponent, ConnectionNet, SchematicDoc } from '../types';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'BRANDS' | 'SERIES' | 'MODELS' | 'BOARDS' | 'COMPONENTS' | 'CONNECTIONS' | 'SCHEMATICS'
  >('OVERVIEW');

  // Loaded Data from Firebase
  const [brands, setBrands] = useState<Brand[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [models, setModels] = useState<DeviceModel[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [components, setComponents] = useState<BoardComponent[]>([]);
  const [connections, setConnections] = useState<ConnectionNet[]>([]);
  const [schematics, setSchematics] = useState<SchematicDoc[]>([]);

  // Selection states for drill-down management
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Forms states
  const [brandForm, setBrandForm] = useState({ name: '', nameAr: '', country: '', logoUrl: '' });
  const [seriesForm, setSeriesForm] = useState({ brandId: '', name: '', description: '' });
  const [modelForm, setModelForm] = useState({ 
    brandId: '', 
    seriesId: '', 
    name: '', 
    modelCode: '', 
    releaseYear: 2024, 
    specsSummary: '', 
    imageUrl: '' 
  });
  const [boardForm, setBoardForm] = useState({ 
    modelId: '', 
    name: 'Main Motherboard', 
    version: 'Rev 1.0', 
    partNumber: '', 
    boardSideAImage: '', 
    boardSideBImage: '' 
  });
  const [compForm, setCompForm] = useState({
    refDes: 'U1001',
    name: 'Power Management IC (PMIC)',
    type: 'IC' as any,
    partNumber: 'PM8150',
    package: 'BGA-120',
    layer: 'TOP' as 'TOP' | 'BOTTOM',
    x: 450,
    y: 320,
    width: 80,
    height: 80,
    diodeModeValue: '0.450',
    voltageValue: '3.8V',
    value: '',
    connectedNets: 'VBUS_5V, PP_VDD_MAIN',
  });
  const [netForm, setNetForm] = useState({
    name: 'PP_VDD_MAIN',
    voltage: '4.2V',
    type: 'POWER' as any,
    color: '#ef4444',
    description: 'خط التغذية الرئيسي للجهاز',
    pointsJson: '[{"x": 450, "y": 320, "layer": "TOP", "refDes": "U1001"}]',
  });
  const [schematicForm, setSchematicForm] = useState({
    title: 'Service Manual & Schematic Diagram',
    category: 'SCHEMATIC_PDF' as any,
    fileUrl: '',
    pageCount: 45,
    version: 'v1.0'
  });

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // Fetch initial hierarchy
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [bData, sData, mData] = await Promise.all([
        getBrands(),
        getAllSeries(),
        getAllModels()
      ]);
      setBrands(bData);
      setSeriesList(sData);
      setModels(mData);
    } catch (err: any) {
      showNotification('خطأ في جلب البيانات: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // When model is selected, load its boards & schematics
  useEffect(() => {
    if (selectedModelId) {
      getBoardsByModel(selectedModelId).then(bList => {
        setBoards(bList);
        if (bList.length > 0 && !selectedBoardId) {
          setSelectedBoardId(bList[0].id);
        }
      });
      getSchematicsByModel(selectedModelId).then(setSchematics);
    } else {
      setBoards([]);
      setSchematics([]);
    }
  }, [selectedModelId]);

  // When board is selected, load its components & connections
  useEffect(() => {
    if (selectedBoardId) {
      getComponentsByBoard(selectedBoardId).then(setComponents);
      getConnectionsByBoard(selectedBoardId).then(setConnections);
    } else {
      setComponents([]);
      setConnections([]);
    }
  }, [selectedBoardId]);

  // Handle Add Brand
  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandForm.name) return;
    try {
      await addBrand(brandForm);
      showNotification('تمت إضافة الشركة بنجاح إلى قاعدة البيانات');
      setBrandForm({ name: '', nameAr: '', country: '', logoUrl: '' });
      loadAllData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // Handle Add Series
  const handleAddSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesForm.brandId || !seriesForm.name) {
      showNotification('يرجى اختيار الشركة وإدخال اسم السلسلة', 'error');
      return;
    }
    try {
      await addSeries(seriesForm);
      showNotification('تمت إضافة السلسلة بنجاح');
      setSeriesForm({ ...seriesForm, name: '', description: '' });
      loadAllData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // Handle Add Model
  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelForm.seriesId || !modelForm.name || !modelForm.modelCode) {
      showNotification('يرجى ملء جميع الحقول المطلوبة للموديل', 'error');
      return;
    }
    try {
      await addModel(modelForm);
      showNotification('تمت إضافة موديل الهاتف بنجاح إلى قاعدة البيانات');
      setModelForm({ ...modelForm, name: '', modelCode: '', specsSummary: '', imageUrl: '' });
      loadAllData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // Handle Add Board
  const handleAddBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModelId) {
      showNotification('يرجى اختيار موديل الهاتف أولاً لربط البوردة به', 'error');
      return;
    }
    try {
      await addBoard({
        ...boardForm,
        modelId: selectedModelId,
      });
      showNotification('تم إنشاء بوردة جديدة للجهاز بنجاح');
      const updated = await getBoardsByModel(selectedModelId);
      setBoards(updated);
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // Handle Add Component
  const handleAddComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoardId) {
      showNotification('يرجى تحديد البوردة أولاً لإضافة المكون عليها', 'error');
      return;
    }
    try {
      const netArr = compForm.connectedNets ? compForm.connectedNets.split(',').map(s => s.trim()) : [];
      await addComponent({
        boardId: selectedBoardId,
        refDes: compForm.refDes,
        name: compForm.name,
        type: compForm.type,
        partNumber: compForm.partNumber,
        package: compForm.package,
        layer: compForm.layer,
        x: Number(compForm.x),
        y: Number(compForm.y),
        width: Number(compForm.width),
        height: Number(compForm.height),
        diodeModeValue: compForm.diodeModeValue,
        voltageValue: compForm.voltageValue,
        value: compForm.value,
        connectedNets: netArr,
      });
      showNotification(`تمت إضافة المكون ${compForm.refDes} بنجاح إلى البوردة`);
      const updated = await getComponentsByBoard(selectedBoardId);
      setComponents(updated);
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // Handle Add Connection Net
  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoardId) {
      showNotification('يرجى تحديد البوردة أولاً لربط المسار بها', 'error');
      return;
    }
    try {
      let points = [];
      try {
        points = JSON.parse(netForm.pointsJson);
      } catch {
        points = [];
      }

      await addConnectionNet({
        boardId: selectedBoardId,
        name: netForm.name,
        voltage: netForm.voltage,
        type: netForm.type,
        color: netForm.color,
        description: netForm.description,
        points,
      });
      showNotification(`تم حفظ المسار الكهربائي ${netForm.name}`);
      const updated = await getConnectionsByBoard(selectedBoardId);
      setConnections(updated);
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // Handle Add Schematic Document
  const handleAddSchematic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModelId) {
      showNotification('يرجى اختيار الموديل أولاً', 'error');
      return;
    }
    try {
      await addSchematicDoc({
        modelId: selectedModelId,
        boardId: selectedBoardId || undefined,
        title: schematicForm.title,
        category: schematicForm.category,
        fileUrl: schematicForm.fileUrl,
        pageCount: Number(schematicForm.pageCount),
        version: schematicForm.version,
      });
      showNotification('تمت إضافة المخطط الفني بنجاح');
      const updated = await getSchematicsByModel(selectedModelId);
      setSchematics(updated);
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Admin Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white">لوحة تحكم إدارة المخططات والأجهزة (Admin Dashboard)</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            إدارة الشركات، السلاسل، الموديلات، البوردات، مكونات الـ Boardview، المسارات الكهربائية، وملفات الـ Schematics.
          </p>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="flex items-center space-x-1.5 space-x-reverse bg-slate-800 hover:bg-slate-700 text-xs px-3 py-2 rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث البيانات</span>
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {statusMsg && (
        <div className={`mx-6 mt-4 p-3 rounded-lg border text-sm flex items-center space-x-2 space-x-reverse ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' 
            : 'bg-rose-950/40 text-rose-300 border-rose-800'
        }`}>
          {statusMsg.type === 'success' ? <Check className="w-4 h-4 ml-2" /> : <AlertCircle className="w-4 h-4 ml-2" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-1 space-x-reverse px-6 pt-4 border-b border-slate-800 overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: 'نظرة عامة وإحصائيات', icon: BarChart3 },
          { id: 'BRANDS', label: 'الشركات المصنعة', icon: Building2 },
          { id: 'SERIES', label: 'السلاسل (Series)', icon: Layers },
          { id: 'MODELS', label: 'الموديلات (Models)', icon: Smartphone },
          { id: 'BOARDS', label: 'البوردات (Motherboards)', icon: Cpu },
          { id: 'COMPONENTS', label: 'المكونات (Components)', icon: Cpu },
          { id: 'CONNECTIONS', label: 'المسارات (Nets)', icon: Share2 },
          { id: 'SCHEMATICS', label: 'ملفات المخططات (PDFs)', icon: FileText },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 space-x-reverse px-4 py-2.5 text-xs font-semibold rounded-t-lg transition whitespace-nowrap border-b-2 ${
                isActive
                  ? 'border-cyan-500 text-cyan-400 bg-slate-900/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <Icon className="w-4 h-4 ml-1.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="p-6 flex-1">
        {/* OVERVIEW TAB */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">إجمالي الشركات</span>
                  <Building2 className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-2">{brands.length}</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">إجمالي السلاسل</span>
                  <Layers className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-2">{seriesList.length}</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">الموديلات المسجلة</span>
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-2">{models.length}</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">البوردات المعرفة</span>
                  <Cpu className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-2">{boards.length}</div>
              </div>
            </div>

            {/* Quick Guide */}
            <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-800/40 rounded-xl p-5">
              <h2 className="text-base font-bold text-white mb-2">كيفية إدخال وإدارة الهواتف والمخططات:</h2>
              <div className="grid md:grid-cols-3 gap-4 text-xs text-slate-300 mt-3">
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <div className="font-bold text-cyan-400 mb-1">1. إضافة الشركة والسلسلة والموديل</div>
                  <p>أضف الشركة (مثل Apple, Samsung)، ثم أنشئ السلسلة (مثل Galaxy S أو iPhone)، ثم أضف الموديل مع كود الطراز الرسمي.</p>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <div className="font-bold text-cyan-400 mb-1">2. إنشاء بوردة الهاتف (Motherboard)</div>
                  <p>أضف اللوحة الأم (Top & Bottom) وحدد الصور عالية الدقة إن توفرت لطبقات البوردة.</p>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <div className="font-bold text-cyan-400 mb-1">3. إضافة المكونات والمسارات الكهربائية</div>
                  <p>أدخل الدوائر المتكاملة (ICs)، قيم الممانعة Diode Mode، والمسارات مثل PP_VDD_MAIN لتوفير تتبع تفاعلي للفنيين.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BRANDS TAB */}
        {activeTab === 'BRANDS' && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Add Brand Form */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center">
                <Plus className="w-4 h-4 ml-1.5 text-cyan-400" />
                إضافة شركة جديدة
              </h2>
              <form onSubmit={handleAddBrand} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">اسم الشركة بالإنجليزية *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Samsung, Apple, Xiaomi"
                    value={brandForm.name}
                    onChange={e => setBrandForm({ ...brandForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">الاسم بالعربية</label>
                  <input
                    type="text"
                    placeholder="e.g. سامسونج، آبل"
                    value={brandForm.nameAr}
                    onChange={e => setBrandForm({ ...brandForm, nameAr: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">بلد المنشأ</label>
                  <input
                    type="text"
                    placeholder="e.g. South Korea, USA, China"
                    value={brandForm.country}
                    onChange={e => setBrandForm({ ...brandForm, country: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">رابط الشعار Logo URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={brandForm.logoUrl}
                    onChange={e => setBrandForm({ ...brandForm, logoUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 rounded-lg text-xs transition"
                >
                  حفظ الشركة
                </button>
              </form>
            </div>

            {/* Brands List */}
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <h2 className="text-sm font-bold text-white mb-4">قائمة الشركات المسجلة ({brands.length})</h2>
              {brands.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  لا توجد شركات مضافة حالياً. قم بإضافة أول شركة من النموذج.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {brands.map(b => (
                    <div key={b.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        {b.logoUrl ? (
                          <img src={b.logoUrl} alt={b.name} className="w-8 h-8 object-contain rounded" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center font-bold text-xs text-cyan-400">
                            {b.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-xs text-white">{b.name}</div>
                          {b.nameAr && <div className="text-[11px] text-slate-400">{b.nameAr}</div>}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteBrand(b.id).then(loadAllData)}
                        className="text-rose-400 hover:text-rose-300 p-1.5"
                        title="حذف الشركة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SERIES TAB */}
        {activeTab === 'SERIES' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center">
                <Plus className="w-4 h-4 ml-1.5 text-cyan-400" />
                إضافة سلسلة أجهزة (Series)
              </h2>
              <form onSubmit={handleAddSeries} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">الشركة التابعة لها *</label>
                  <select
                    required
                    value={seriesForm.brandId}
                    onChange={e => setSeriesForm({ ...seriesForm, brandId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">اختر الشركة...</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.nameAr || ''})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">اسم السلسلة *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Galaxy S Series, iPhone, Redmi Note"
                    value={seriesForm.name}
                    onChange={e => setSeriesForm({ ...seriesForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">الوصف</label>
                  <input
                    type="text"
                    placeholder="فئة الهواتف الرائدة..."
                    value={seriesForm.description}
                    onChange={e => setSeriesForm({ ...seriesForm, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 rounded-lg text-xs transition"
                >
                  حفظ السلسلة
                </button>
              </form>
            </div>

            <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <h2 className="text-sm font-bold text-white mb-4">السلاسل المعرفة ({seriesList.length})</h2>
              {seriesList.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  لا توجد سلاسل مسجلة حتى الآن.
                </div>
              ) : (
                <div className="space-y-2">
                  {seriesList.map(s => {
                    const brand = brands.find(b => b.id === s.brandId);
                    return (
                      <div key={s.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs text-white">{s.name}</div>
                          <div className="text-[11px] text-cyan-400">الشركة: {brand?.name || 'غير محدد'}</div>
                        </div>
                        <button
                          onClick={() => deleteSeries(s.id).then(loadAllData)}
                          className="text-rose-400 hover:text-rose-300 p-1.5"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODELS TAB */}
        {activeTab === 'MODELS' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center">
                <Plus className="w-4 h-4 ml-1.5 text-cyan-400" />
                إضافة موديل هاتف جديد
              </h2>
              <form onSubmit={handleAddModel} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">الشركة *</label>
                  <select
                    required
                    value={modelForm.brandId}
                    onChange={e => setModelForm({ ...modelForm, brandId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">اختر الشركة...</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">السلسلة *</label>
                  <select
                    required
                    value={modelForm.seriesId}
                    onChange={e => setModelForm({ ...modelForm, seriesId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">اختر السلسلة...</option>
                    {seriesList
                      .filter(s => !modelForm.brandId || s.brandId === modelForm.brandId)
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">اسم الهاتف *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Galaxy S23 Ultra, iPhone 14 Pro"
                    value={modelForm.name}
                    onChange={e => setModelForm({ ...modelForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">كود الموديل Model Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SM-S918B, A2894"
                    value={modelForm.modelCode}
                    onChange={e => setModelForm({ ...modelForm, modelCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">سنة الإصدار</label>
                  <input
                    type="number"
                    value={modelForm.releaseYear}
                    onChange={e => setModelForm({ ...modelForm, releaseYear: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">رابط صورة الجهاز</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={modelForm.imageUrl}
                    onChange={e => setModelForm({ ...modelForm, imageUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 rounded-lg text-xs transition"
                >
                  حفظ الموديل
                </button>
              </form>
            </div>

            <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <h2 className="text-sm font-bold text-white mb-4">قائمة الهواتف والموديلات ({models.length})</h2>
              {models.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  لا توجد هواتف مسجلة حتى الآن.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                  {models.map(m => (
                    <div key={m.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-white">{m.name}</div>
                        <div className="text-[11px] text-cyan-400 font-mono">طراز: {m.modelCode}</div>
                        {m.releaseYear && <div className="text-[10px] text-slate-500">{m.releaseYear}</div>}
                      </div>
                      <button
                        onClick={() => deleteModel(m.id).then(loadAllData)}
                        className="text-rose-400 hover:text-rose-300 p-1.5"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOARDS TAB */}
        {activeTab === 'BOARDS' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center space-x-3 space-x-reverse">
              <span className="text-xs text-slate-400">حدد موديل الهاتف لربط أو استعراض البوردات:</span>
              <select
                value={selectedModelId}
                onChange={e => setSelectedModelId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">اختر الموديل...</option>
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.modelCode})</option>
                ))}
              </select>
            </div>

            {selectedModelId && (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                  <h2 className="text-sm font-bold text-white mb-4 flex items-center">
                    <Plus className="w-4 h-4 ml-1.5 text-cyan-400" />
                    إضافة بوردة / Motherboard
                  </h2>
                  <form onSubmit={handleAddBoard} className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">اسم اللوحة *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Main Board (Top), Sub Board (Charging)"
                        value={boardForm.name}
                        onChange={e => setBoardForm({ ...boardForm, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">الإصدار Revision</label>
                      <input
                        type="text"
                        placeholder="e.g. Rev 1.0, Rev 2.2"
                        value={boardForm.version}
                        onChange={e => setBoardForm({ ...boardForm, version: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">رابط صورة الوجه العلوي (Side A Image URL)</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={boardForm.boardSideAImage}
                        onChange={e => setBoardForm({ ...boardForm, boardSideAImage: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">رابط صورة الوجه السفلي (Side B Image URL)</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={boardForm.boardSideBImage}
                        onChange={e => setBoardForm({ ...boardForm, boardSideBImage: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 rounded-lg text-xs transition"
                    >
                      حفظ البوردة
                    </button>
                  </form>
                </div>

                <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl">
                  <h2 className="text-sm font-bold text-white mb-4">بوردات هذا الجهاز ({boards.length})</h2>
                  {boards.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      لا توجد بوردات مضافة لهذا الموديل بعد.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {boards.map(b => (
                        <div key={b.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                          <div>
                            <div className="font-bold text-xs text-white">{b.name}</div>
                            <div className="text-[11px] text-cyan-400">الإصدار: {b.version || 'الأساسي'}</div>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <button
                              onClick={() => {
                                setSelectedBoardId(b.id);
                                setActiveTab('COMPONENTS');
                              }}
                              className="bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs px-2.5 py-1 rounded"
                            >
                              إدارة المكونات
                            </button>
                            <button
                              onClick={() => deleteBoard(b.id).then(() => getBoardsByModel(selectedModelId).then(setBoards))}
                              className="text-rose-400 hover:text-rose-300 p-1.5"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMPONENTS TAB */}
        {activeTab === 'COMPONENTS' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center gap-3">
              <span className="text-xs text-slate-400">اختر الجهاز:</span>
              <select
                value={selectedModelId}
                onChange={e => setSelectedModelId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white"
              >
                <option value="">اختر الموديل...</option>
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>

              <span className="text-xs text-slate-400">اختر البوردة:</span>
              <select
                value={selectedBoardId}
                onChange={e => setSelectedBoardId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white"
              >
                <option value="">اختر البوردة...</option>
                {boards.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {selectedBoardId && (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                  <h2 className="text-sm font-bold text-white mb-4 flex items-center">
                    <Plus className="w-4 h-4 ml-1.5 text-cyan-400" />
                    إضافة مكون إلكتروني على البوردة
                  </h2>
                  <form onSubmit={handleAddComponent} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">الرمز (RefDes) *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. U1001, C204, TP1"
                          value={compForm.refDes}
                          onChange={e => setCompForm({ ...compForm, refDes: e.target.value.toUpperCase() })}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">نوع المكون *</label>
                        <select
                          value={compForm.type}
                          onChange={e => setCompForm({ ...compForm, type: e.target.value as any })}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="IC">IC دائرة متكاملة</option>
                          <option value="CAPACITOR">Capacitor مكثف</option>
                          <option value="RESISTOR">Resistor مقاومة</option>
                          <option value="INDUCTOR">Inductor ملف</option>
                          <option value="DIODE">Diode دايود</option>
                          <option value="TEST_POINT">Test Point نقطة فحص</option>
                          <option value="CONNECTOR">Connector كونكتور</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">اسم أو وظيفة المكون</label>
                      <input
                        type="text"
                        placeholder="e.g. Power Management IC, Audio Amp"
                        value={compForm.name}
                        onChange={e => setCompForm({ ...compForm, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">رقم القطعة Part No.</label>
                        <input
                          type="text"
                          placeholder="e.g. PM8150, WCD9385"
                          value={compForm.partNumber}
                          onChange={e => setCompForm({ ...compForm, partNumber: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">الوجه (Layer) *</label>
                        <select
                          value={compForm.layer}
                          onChange={e => setCompForm({ ...compForm, layer: e.target.value as any })}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="TOP">الوجه العلوي (TOP)</option>
                          <option value="BOTTOM">الوجه السفلي (BOTTOM)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">X (أفقي)</label>
                        <input
                          type="number"
                          value={compForm.x}
                          onChange={e => setCompForm({ ...compForm, x: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Y (رأسي)</label>
                        <input
                          type="number"
                          value={compForm.y}
                          onChange={e => setCompForm({ ...compForm, y: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">العرض W</label>
                        <input
                          type="number"
                          value={compForm.width}
                          onChange={e => setCompForm({ ...compForm, width: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">الارتفاع H</label>
                        <input
                          type="number"
                          value={compForm.height}
                          onChange={e => setCompForm({ ...compForm, height: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">ممانعة الدايود (Diode Value)</label>
                        <input
                          type="text"
                          placeholder="e.g. 0.450 V"
                          value={compForm.diodeModeValue}
                          onChange={e => setCompForm({ ...compForm, diodeModeValue: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono text-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">الجهد المتوقع (Voltage)</label>
                        <input
                          type="text"
                          placeholder="e.g. 3.8V, 1.8V"
                          value={compForm.voltageValue}
                          onChange={e => setCompForm({ ...compForm, voltageValue: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono text-amber-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">المسارات المتصلة بها (مفصولة بفواصل)</label>
                      <input
                        type="text"
                        placeholder="VBUS_5V, PP_VDD_MAIN"
                        value={compForm.connectedNets}
                        onChange={e => setCompForm({ ...compForm, connectedNets: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 rounded-lg text-xs transition"
                    >
                      إضافة المكون للبوردة
                    </button>
                  </form>
                </div>

                <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl">
                  <h2 className="text-sm font-bold text-white mb-4">مكونات البوردة ({components.length})</h2>
                  {components.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      لا توجد مكونات مسجلة على هذه البوردة بعد.
                    </div>
                  ) : (
                    <div className="max-h-[500px] overflow-y-auto space-y-2">
                      {components.map(c => (
                        <div key={c.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <span className="font-mono font-bold text-amber-400 text-xs bg-slate-900 px-2 py-1 rounded">
                              {c.refDes}
                            </span>
                            <div>
                              <div className="text-xs font-semibold text-white">{c.name || c.type}</div>
                              <div className="text-[11px] text-slate-400">
                                {c.partNumber ? `قطعة: ${c.partNumber} | ` : ''}
                                الوجه: {c.layer} | (X:{c.x}, Y:{c.y})
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 space-x-reverse">
                            {c.diodeModeValue && (
                              <span className="text-[11px] text-emerald-400 font-mono">
                                {c.diodeModeValue}V
                              </span>
                            )}
                            <button
                              onClick={() => deleteComponent(c.id).then(() => getComponentsByBoard(selectedBoardId).then(setComponents))}
                              className="text-rose-400 hover:text-rose-300 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONNECTIONS / NETS TAB */}
        {activeTab === 'CONNECTIONS' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center space-x-3 space-x-reverse">
              <span className="text-xs text-slate-400">حدد البوردة:</span>
              <select
                value={selectedBoardId}
                onChange={e => setSelectedBoardId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white"
              >
                <option value="">اختر البوردة...</option>
                {boards.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {selectedBoardId && (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                  <h2 className="text-sm font-bold text-white mb-4 flex items-center">
                    <Plus className="w-4 h-4 ml-1.5 text-cyan-400" />
                    إضافة مسار توصيل (Net)
                  </h2>
                  <form onSubmit={handleAddConnection} className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">اسم المسار Line/Net Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. PP_VDD_MAIN, VBUS_5V, I2C3_SDA"
                        value={netForm.name}
                        onChange={e => setNetForm({ ...netForm, name: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">نوع المسار *</label>
                        <select
                          value={netForm.type}
                          onChange={e => setNetForm({ ...netForm, type: e.target.value as any })}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="POWER">Power خط تغذية</option>
                          <option value="GROUND">Ground أرضي</option>
                          <option value="SIGNAL">Signal إشارة</option>
                          <option value="DATA">Data بيانات</option>
                          <option value="CLOCK">Clock تردد</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">الجهد</label>
                        <input
                          type="text"
                          placeholder="e.g. 4.2V, 1.8V"
                          value={netForm.voltage}
                          onChange={e => setNetForm({ ...netForm, voltage: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">لون التمييز للمسار</label>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <input
                          type="color"
                          value={netForm.color}
                          onChange={e => setNetForm({ ...netForm, color: e.target.value })}
                          className="h-8 w-12 rounded bg-transparent border border-slate-800 cursor-pointer"
                        />
                        <span className="font-mono text-xs text-slate-300">{netForm.color}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">نقاط التوصيل (JSON Format)</label>
                      <textarea
                        rows={3}
                        value={netForm.pointsJson}
                        onChange={e => setNetForm({ ...netForm, pointsJson: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-[11px] text-white font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 rounded-lg text-xs transition"
                    >
                      حفظ المسار
                    </button>
                  </form>
                </div>

                <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl">
                  <h2 className="text-sm font-bold text-white mb-4">المسارات المعرفة على هذه البوردة ({connections.length})</h2>
                  {connections.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      لا توجد مسارات مسجلة لهذه البوردة بعد.
                    </div>
                  ) : (
                    <div className="max-h-[500px] overflow-y-auto space-y-2">
                      {connections.map(net => (
                        <div key={net.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <span 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: net.color || '#06b6d4' }} 
                            />
                            <div>
                              <div className="font-mono font-bold text-xs text-white">{net.name}</div>
                              <div className="text-[11px] text-slate-400">
                                {net.voltage ? `الجهد: ${net.voltage} | ` : ''}
                                {net.points?.length || 0} نقاط توصيل
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteConnectionNet(net.id).then(() => getConnectionsByBoard(selectedBoardId).then(setConnections))}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SCHEMATICS TAB */}
        {activeTab === 'SCHEMATICS' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center space-x-3 space-x-reverse">
              <span className="text-xs text-slate-400">اختر الجهاز:</span>
              <select
                value={selectedModelId}
                onChange={e => setSelectedModelId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white"
              >
                <option value="">اختر الموديل...</option>
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {selectedModelId && (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                  <h2 className="text-sm font-bold text-white mb-4 flex items-center">
                    <Plus className="w-4 h-4 ml-1.5 text-cyan-400" />
                    إضافة ملف مخطط أو كتيب صيانة
                  </h2>
                  <form onSubmit={handleAddSchematic} className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">عنوان المخطط *</label>
                      <input
                        type="text"
                        required
                        value={schematicForm.title}
                        onChange={e => setSchematicForm({ ...schematicForm, title: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">النوع *</label>
                      <select
                        value={schematicForm.category}
                        onChange={e => setSchematicForm({ ...schematicForm, category: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="SCHEMATIC_PDF">Schematic Diagram (مخطط دوائر)</option>
                        <option value="SERVICE_MANUAL">Service Manual (دليل الصيانة الرسمي)</option>
                        <option value="BLOCK_DIAGRAM">Block Diagram (مخطط الكتل)</option>
                        <option value="PINOUT">Pinout (توصيل الأرجل والكونكتورات)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">رابط الملف السحابي (Cloud URL / PDF Link) *</label>
                      <input
                        type="url"
                        required
                        placeholder="https://..."
                        value={schematicForm.fileUrl}
                        onChange={e => setSchematicForm({ ...schematicForm, fileUrl: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">عدد الصفحات</label>
                        <input
                          type="number"
                          value={schematicForm.pageCount}
                          onChange={e => setSchematicForm({ ...schematicForm, pageCount: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">الإصدار</label>
                        <input
                          type="text"
                          value={schematicForm.version}
                          onChange={e => setSchematicForm({ ...schematicForm, version: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 rounded-lg text-xs transition"
                    >
                      حفظ المخطط
                    </button>
                  </form>
                </div>

                <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl">
                  <h2 className="text-sm font-bold text-white mb-4">مخططات هذا الموديل ({schematics.length})</h2>
                  {schematics.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      لا توجد مخططات PDF مسجلة لهذا الموديل.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {schematics.map(s => (
                        <div key={s.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <FileText className="w-5 h-5 text-amber-400" />
                            <div>
                              <div className="text-xs font-bold text-white">{s.title}</div>
                              <div className="text-[11px] text-slate-400 font-mono truncate max-w-sm">{s.fileUrl}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteSchematicDoc(s.id).then(() => getSchematicsByModel(selectedModelId).then(setSchematics))}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
