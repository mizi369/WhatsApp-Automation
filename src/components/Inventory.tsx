import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle,
  X,
  Trash2,
  Printer,
  FileSpreadsheet,
  Edit2,
  Save,
  DollarSign,
  Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, TABLES } from '../lib/db';
import { InventoryItem, PaymentType, PaymentMethod } from '../types';

export default function Inventory({ showToast }: { showToast: any }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [shopInfo, setShopInfo] = useState({
    shop_name: '',
    date: new Date().toISOString().split('T')[0],
    payment_type: 'Debit' as PaymentType,
    payment_method: 'Tunai' as PaymentMethod,
  });

  const [formItems, setFormItems] = useState<any[]>([
    { item_name: '', unit: 'pcs', stock: 1, buy_price: 0, sell_price: 0 }
  ]);

  useEffect(() => {
    loadItems();
  }, []);

  const commonItems = [
    'PVC Casing 2 x 3',
    'Insulation',
    'Copper Tube 1/4',
    'Copper Tube 1/2',
    'Gas R22',
    'Gas R32',
    'Gas R410A',
    'Drain Pipe',
    'Bracket Outdoor',
    'Capacitor 35uF',
    'Capacitor 40uF',
    'Capacitor 45uF',
    'Contactors',
    'Fan Motor',
    'Insulation Tape'
  ];

  const commonShops = [
    'Kedai Ali Hardware',
    'Kedai Mizi Engineering',
    'MNF Hardware',
    'Perniagaan Aircond Jaya',
    'Cooling Parts Center'
  ];

  const loadItems = () => {
    const data = db.getAll<InventoryItem>(TABLES.INVENTORY);
    setItems(data);
  };

  const addRow = () => {
    setFormItems([...formItems, { item_name: '', unit: 'pcs', stock: 1, buy_price: 0, sell_price: 0 }]);
  };

  const removeRow = (index: number) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((_, i) => i !== index));
    }
  };

  const updateItemField = (index: number, field: string, value: any) => {
    const newItems = [...formItems];
    newItems[index][field] = value;
    
    if (field === 'buy_price') {
      const buy = parseFloat(value) || 0;
      newItems[index].sell_price = parseFloat((buy * 1.3).toFixed(2));
    }
    
    setFormItems(newItems);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        // Single item update (legacy/edit mode)
        const item = formItems[0];
        const status = item.stock > 0 ? 'Ada' : 'Habis';
        const payload = {
          shop_name: shopInfo.shop_name,
          payment_type: shopInfo.payment_type,
          payment_method: shopInfo.payment_method,
          item_name: item.item_name,
          unit: item.unit,
          stock: item.stock,
          buy_price: item.buy_price,
          sell_price: item.sell_price,
          status: status,
        };

        const allItems = db.getAll<InventoryItem>(TABLES.INVENTORY);
        const prevItem = allItems.find(i => i.id === editingId);
        
        const { error } = await db.update<InventoryItem>(TABLES.INVENTORY, editingId, payload as any);
        
        if (!error) {
          if (prevItem && item.stock > prevItem.stock) {
            const addedStock = item.stock - prevItem.stock;
            await db.insert(TABLES.TRANSACTIONS, {
              id: `inv-upd-${Date.now()}`,
              date: shopInfo.date,
              amount: item.buy_price * addedStock,
              type: 'debit',
              payment_method: shopInfo.payment_method,
              description: `Tambah Stok: ${item.item_name} (+${addedStock})`,
              source: 'Inventory'
            });
          }
          showToast('Item inventory dikemaskini!', 'success');
        }
      } else {
        // Bulk insert / Merge logic
        let totalReceiptAmount = 0;
        const itemNames: string[] = [];
        const currentInventory = db.getAll<InventoryItem>(TABLES.INVENTORY);

        for (const item of formItems) {
          // Check if item with same name already exists
          const existing = currentInventory.find(i => (i.item_name || (i as any).itemName).trim().toLowerCase() === item.item_name.trim().toLowerCase());
          
          if (existing) {
            // Update existing item: add to current stock
            const newStock = existing.stock + item.stock;
            const status = newStock > 0 ? 'Ada' : 'Habis';
            
            await db.update<InventoryItem>(TABLES.INVENTORY, existing.id, {
              ...existing,
              shop_name: shopInfo.shop_name,
              payment_type: shopInfo.payment_type,
              payment_method: shopInfo.payment_method,
              stock: newStock,
              buy_price: item.buy_price,
              sell_price: item.sell_price,
              status: status,
            });
          } else {
            // Insert new item
            const status = item.stock > 0 ? 'Ada' : 'Habis';
            const itemId = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            
            const payload = {
              id: itemId,
              shop_name: shopInfo.shop_name,
              payment_type: shopInfo.payment_type,
              payment_method: shopInfo.payment_method,
              item_name: item.item_name,
              unit: item.unit,
              stock: item.stock,
              buy_price: item.buy_price,
              sell_price: item.sell_price,
              status: status,
            };

            await db.insert<InventoryItem>(TABLES.INVENTORY, payload as any);
          }
          
          totalReceiptAmount += (item.buy_price * item.stock);
          itemNames.push(item.item_name);
        }

        // Record single transaction for the whole receipt
        await db.insert(TABLES.TRANSACTIONS, {
          id: `inv-bulk-${Date.now()}`,
          date: shopInfo.date,
          amount: totalReceiptAmount,
          type: 'debit',
          payment_method: shopInfo.payment_method,
          description: `Pembelian Pukal (${shopInfo.shop_name}): ${itemNames.join(', ')}`,
          source: 'Inventory'
        });

        showToast(`${formItems.length} item disimpan & direkod ke Debit!`, 'success');
      }
      
      setIsModalOpen(false);
      setEditingId(null);
      resetForm();
      loadItems();
    } catch (error) {
      showToast('Gagal menyimpan item', 'error');
    }
  };

  const resetForm = () => {
    setShopInfo({
      shop_name: '',
      date: new Date().toISOString().split('T')[0],
      payment_type: 'Debit',
      payment_method: 'Tunai',
    });
    setFormItems([{ item_name: '', unit: 'pcs', stock: 1, buy_price: 0, sell_price: 0 }]);
  };

  const handleEdit = (item: InventoryItem) => {
    setShopInfo({
      shop_name: item.shop_name,
      date: new Date().toISOString().split('T')[0],
      payment_type: item.payment_type as PaymentType,
      payment_method: item.payment_method as PaymentMethod,
    });
    setFormItems([{
      item_name: item.item_name,
      unit: item.unit,
      stock: item.stock,
      buy_price: item.buy_price,
      sell_price: item.sell_price,
    }]);
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Adakah anda pasti mahu memadam item ini?')) {
      await db.delete(TABLES.INVENTORY, id);
      showToast('Item berjaya dipadam', 'error');
      loadItems();
    }
  };

  const filteredItems = items.filter(item => 
    (item.item_name || (item as any).itemName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.shop_name || (item as any).shopName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase">Inventori</h1>
          <p className="text-slate-400 mt-1">Urus stok barang dan pengiraan harga automatik (+30%).</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => showToast('Generating stock report...', 'info')}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-bold hover:bg-white/10 transition-all text-slate-300"
          >
            <Printer size={18} />
            Cetak Laporan
          </button>
          <button 
            onClick={() => showToast('Exporting inventory to Excel...', 'info')}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-bold hover:bg-white/10 transition-all text-slate-300"
          >
            <FileSpreadsheet size={18} />
            Export Excel
          </button>
          <button 
            onClick={() => {
              setEditingId(null);
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            <Plus size={18} />
            Tambah Stok
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Jumlah Nilai Stok (Beli)</p>
              <h3 className="text-2xl font-black text-white">RM {items.reduce((acc, curr) => acc + (curr.buy_price * curr.stock), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Stok Habis / Rendah</p>
              <h3 className="text-2xl font-black text-red-500">{items.filter(i => i.stock <= 0).length} Item</h3>
            </div>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-secondary/10 text-secondary rounded-xl">
              <Package size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Jumlah Item Berbeza</p>
              <h3 className="text-2xl font-black text-secondary">{items.length} Item</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dark border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl my-8 overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="font-bold text-lg text-white">{editingId ? 'Kemaskini Barang' : 'Tambah Barang & Harga'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Kedai</label>
                      <div className="relative group/shop">
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                          required 
                          type="text" 
                          className="w-full bg-darker border border-white/10 rounded-xl px-10 py-2.5 text-sm focus:border-secondary outline-none text-white" 
                          placeholder="e.g. MNF Hardware" 
                          value={shopInfo.shop_name} 
                          onChange={e => setShopInfo({...shopInfo, shop_name: e.target.value})} 
                        />
                        {shopInfo.shop_name && (
                          <div className="absolute z-[110] left-0 right-0 mt-1 bg-darker border border-white/10 rounded-xl shadow-2xl hidden group-focus-within/shop:block max-h-40 overflow-y-auto custom-scrollbar">
                            {[...new Set([...commonShops, ...items.map(i => i.shop_name)])]
                              .filter(name => 
                                name.toLowerCase().includes(shopInfo.shop_name.toLowerCase()) && 
                                name.toLowerCase() !== shopInfo.shop_name.toLowerCase()
                              )
                              .map((name, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setShopInfo({...shopInfo, shop_name: name})}
                                  className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-white/10 border-b border-white/5 flex justify-between items-center"
                                >
                                  <span>{name}</span>
                                  {items.some(inv => inv.shop_name === name) ? (
                                    <span className="text-[8px] text-secondary font-bold italic">Rekod lama</span>
                                  ) : (
                                    <span className="text-[8px] text-slate-500 italic">Cadangan</span>
                                  )}
                                </button>
                              ))
                            }
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tarikh & Bulan</label>
                      <input required type="date" className="w-full bg-darker border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-secondary outline-none text-white" value={shopInfo.date} onChange={e => setShopInfo({...shopInfo, date: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jenis Bayaran</label>
                        <select className="w-full bg-darker border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-secondary outline-none text-white" value={shopInfo.payment_type} onChange={e => setShopInfo({...shopInfo, payment_type: e.target.value as PaymentType})}>
                          <option value="Debit">Debit</option>
                          <option value="Credit">Credit</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kaedah Bayaran</label>
                        <select className="w-full bg-darker border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-secondary outline-none text-white" value={shopInfo.payment_method} onChange={e => setShopInfo({...shopInfo, payment_method: e.target.value as PaymentMethod})}>
                          <option value="Tunai">Tunai</option>
                          <option value="Transfer">Transfer</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Senarai Barang</h4>
                    {!editingId && (
                      <button type="button" onClick={addRow} className="text-[10px] font-bold text-secondary hover:text-secondary/80 flex items-center gap-1 uppercase tracking-wider">
                        <Plus size={14} /> Tambah Baris
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {formItems.map((item, index) => (
                      <div key={index} className="p-4 bg-white/5 border border-white/10 rounded-2xl relative group/row">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-4 space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Nama Barang</label>
                            <div className="relative group/search">
                              <input 
                                required 
                                type="text" 
                                className="w-full bg-darker border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-secondary outline-none text-white" 
                                placeholder="Cari atau Taip Nama Barang" 
                                value={item.item_name} 
                                onChange={e => updateItemField(index, 'item_name', e.target.value)} 
                              />
                              {!editingId && (
                                <div className="absolute z-10 left-0 right-0 mt-1 bg-darker border border-white/10 rounded-lg shadow-xl hidden group-focus-within/search:block max-h-40 overflow-y-auto custom-scrollbar">
                                  {/* Filter and combine common items + existing inventory */}
                                  {[...new Set([...commonItems, ...items.map(i => i.item_name)])]
                                    .filter(name => 
                                      name.toLowerCase().includes(item.item_name.toLowerCase()) && 
                                      name.toLowerCase() !== item.item_name.toLowerCase()
                                    )
                                    .slice(0, 10)
                                    .map((name, i) => {
                                      const existingInDb = items.find(inv => inv.item_name.toLowerCase() === name.toLowerCase());
                                      return (
                                        <button
                                          key={i}
                                          type="button"
                                          onClick={() => {
                                            const newItems = [...formItems];
                                            newItems[index] = {
                                              ...newItems[index],
                                              item_name: name,
                                              unit: existingInDb ? existingInDb.unit : 'pcs',
                                              buy_price: existingInDb ? existingInDb.buy_price : 0,
                                              sell_price: existingInDb ? existingInDb.sell_price : 0
                                            };
                                            setFormItems(newItems);
                                          }}
                                          className="w-full text-left px-3 py-2 text-[10px] text-slate-300 hover:bg-white/10 border-b border-white/5 flex justify-between items-center"
                                        >
                                          <span>{name}</span>
                                          {existingInDb ? (
                                            <span className="text-[9px] text-secondary font-bold italic">Sedia ada (RM {existingInDb.buy_price})</span>
                                          ) : (
                                            <span className="text-[9px] text-slate-500 italic">Baru</span>
                                          )}
                                        </button>
                                      );
                                    })
                                  }
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Stok</label>
                            <input required type="number" className="w-full bg-darker border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-secondary outline-none text-white" value={item.stock} onChange={e => updateItemField(index, 'stock', parseInt(e.target.value) || 0)} />
                          </div>
                          <div className="md:col-span-3 space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Harga Beli (RM)</label>
                            <input required type="number" step="0.01" className="w-full bg-darker border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-secondary outline-none text-white" value={item.buy_price} onChange={e => updateItemField(index, 'buy_price', e.target.value)} />
                          </div>
                          <div className="md:col-span-3 space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Jual (+30%)</label>
                            <input required type="number" step="0.01" className="w-full bg-darker border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-secondary outline-none text-secondary font-bold" value={item.sell_price} onChange={e => updateItemField(index, 'sell_price', parseFloat(e.target.value) || 0)} />
                          </div>
                        </div>
                        {!editingId && formItems.length > 1 && (
                          <button type="button" onClick={() => removeRow(index)} className="absolute -right-2 -top-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/row:opacity-100 transition-opacity shadow-lg">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-secondary uppercase mb-1 tracking-widest">Jumlah Keseluruhan Resit</p>
                    <p className="text-2xl font-black text-white">RM {formItems.reduce((acc, curr) => acc + (curr.buy_price * curr.stock), 0).toFixed(2)}</p>
                  </div>
                  <button type="submit" className="px-8 py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                    <Save size={18} />
                    {editingId ? 'Kemaskini Barang' : 'Simpan Semua'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="glass-panel overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Cari inventori..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-darker border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-secondary transition-all text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Tarikh</th>
                <th className="px-6 py-4">Item & Kedai</th>
                <th className="px-6 py-4">Stok / Unit</th>
                <th className="px-6 py-4">Harga Beli</th>
                <th className="px-6 py-4">Harga Jual (+30%)</th>
                <th className="px-6 py-4">Bayaran</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500 italic">Tiada item dijumpai</td>
                </tr>
              ) : filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-400 font-mono">{item.date || '-'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm text-white">{item.item_name}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider flex items-center gap-1">
                      <Store size={10} /> {item.shop_name}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black ${item.stock <= 0 ? 'text-red-500' : 'text-white'}`}>{item.stock}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">{item.unit}</span>
                      {item.stock <= 0 && (
                        <AlertTriangle size={14} className="text-red-500 animate-pulse" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400 font-mono">RM {(Number(item.buy_price || 0) || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm font-black text-secondary font-mono">RM {(Number(item.sell_price || 0) || 0).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase text-slate-500">{item.payment_type}</span>
                      <span className="text-[10px] font-bold text-slate-300">{item.payment_method}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(item)} className="p-2 hover:bg-white/5 text-slate-400 rounded-lg transition-all" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)} 
                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-all"
                        title="Padam"
                      >
                        <Trash2 size={16} />
                      </button>
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ml-2 ${
                        item.stock <= 0 
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}>
                        {item.stock <= 0 ? 'Habis' : 'Ada Stok'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
