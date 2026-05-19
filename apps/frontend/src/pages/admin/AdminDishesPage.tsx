import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, X, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { dishApi, uploadApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { DISH_CATEGORIES } from '../../lib/constants';

interface Dish {
  id: string;
  name: string;
  description: string;
  ingredients: string;
  ingredientsSv: string;
  pieces: number | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  menuType: string;
  isVegetarian: boolean;
  spiceLevel: string;
  category: string;
}

const schema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  ingredients: z.string().min(3),
  ingredientsSv: z.string().min(3),
  pieces: z.number().nullable().optional(),
  price: z.number().positive(),
  imageUrl: z.string().nullable().optional().or(z.literal('')),
  isAvailable: z.boolean(),
  menuType: z.enum(['DAILY', 'FRIDAY', 'BOTH']),
  isVegetarian: z.boolean(),
  spiceLevel: z.enum(['MILD', 'MEDIUM', 'HOT', 'EXTRA_HOT']),
  category: z.string().min(2),
});

type FormData = z.infer<typeof schema>;

const defaultValues: FormData = {
  name: '',
  description: '',
  ingredients: '',
  ingredientsSv: '',
  pieces: null,
  price: 0,
  imageUrl: '',
  isAvailable: true,
  menuType: 'DAILY',
  isVegetarian: false,
  spiceLevel: 'MEDIUM',
  category: 'Curry',
};

const statusColors: Record<string, string> = {
  DAILY: 'bg-blue-100 text-blue-700',
  FRIDAY: 'bg-purple-100 text-purple-700',
  BOTH: 'bg-green-100 text-green-700',
};

export default function AdminDishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Dish | null>(null);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const imageUrl = watch('imageUrl');

  const fetchDishes = async () => {
    try {
      const res = await dishApi.getAll({ limit: 100 });
      setDishes(res.data.data || []);
    } catch {
      toast.error('Failed to load dishes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDishes(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset(defaultValues);
    setShowForm(true);
  };

  const openEdit = (dish: Dish) => {
    setEditing(dish);
    reset({
      name: dish.name,
      description: dish.description,
      ingredients: dish.ingredients,
      ingredientsSv: dish.ingredientsSv,
      price: Number(dish.price),
      imageUrl: dish.imageUrl || '',
      pieces: dish.pieces || null,
      isAvailable: dish.isAvailable,
      menuType: dish.menuType as 'DAILY' | 'FRIDAY' | 'BOTH',
      isVegetarian: dish.isVegetarian,
      spiceLevel: dish.spiceLevel as 'MILD' | 'MEDIUM' | 'HOT' | 'EXTRA_HOT',
      category: dish.category,
    });
    setShowForm(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, imageUrl: data.imageUrl || null, pieces: data.pieces || null };
      if (editing) {
        await dishApi.update(editing.id, payload);
        toast.success('Dish updated!');
      } else {
        await dishApi.create(payload);
        toast.success('Dish created!');
      }
      setShowForm(false);
      fetchDishes();
    } catch {
      toast.error('Failed to save dish');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await dishApi.delete(id);
      toast.success('Dish deleted');
      fetchDishes();
    } catch {
      toast.error('Failed to delete dish');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await dishApi.toggleAvailability(id);
      fetchDishes();
      toast.success('Availability updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadApi.uploadImage(file);
      setValue('imageUrl', res.data.data.url);
      toast.success('Image uploaded!');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const filtered = dishes.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Dishes</h1>
          <p className="text-gray-500 text-sm mt-0.5">{dishes.length} dishes total</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={18} /> Add Dish
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search dishes..."
          className="input-field pl-9 py-2.5"
        />
      </div>

      {/* Dishes Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <motion.div className="w-8 h-8 border-2 border-spice-200 border-t-spice-500 rounded-full mx-auto"
              animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Image', 'Dish', 'Category', 'Menu', 'Price', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((dish) => (
                  <tr key={dish.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={dish.imageUrl || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=80'}
                          alt={dish.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{dish.name}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{dish.description}</p>
                      <div className="flex gap-1 mt-1">
                        {dish.isVegetarian && (
                          <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">🌿 Veg</span>
                        )}
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                          🌶️ {dish.spiceLevel}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{dish.category}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[dish.menuType]}`}>
                        {dish.menuType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">SEK {Number(dish.price)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(dish.id)}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                          dish.isAvailable
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {dish.isAvailable ? <Eye size={12} /> : <EyeOff size={12} />}
                        {dish.isAvailable ? 'Available' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(dish)}
                          className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(dish.id, dish.name)}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">No dishes found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 sm:inset-8 lg:inset-16 bg-white rounded-2xl z-50 flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editing ? 'Edit Dish' : 'Add New Dish'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-xl text-gray-500 hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dish Name *</label>
                    <input {...register('name')} className="input-field" placeholder="e.g. Chicken Biryani" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea {...register('description')} rows={2} className="input-field resize-none"
                      placeholder="Short description of the dish" />
                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                  </div>

                  {/* Ingredients EN */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients (English) *</label>
                    <textarea {...register('ingredients')} rows={2} className="input-field resize-none"
                      placeholder="Chicken, rice, spices..." />
                    {errors.ingredients && <p className="text-red-500 text-xs mt-1">{errors.ingredients.message}</p>}
                  </div>

                  {/* Ingredients SV */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients (Swedish) *</label>
                    <textarea {...register('ingredientsSv')} rows={2} className="input-field resize-none"
                      placeholder="Kyckling, ris, kryddor..." />
                    {errors.ingredientsSv && <p className="text-red-500 text-xs mt-1">{errors.ingredientsSv.message}</p>}
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (SEK) *</label>
                    <input {...register('price', { valueAsNumber: true })} type="number" min="0" step="5"
                      className="input-field" placeholder="120" />
                    {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                  </div>

                  {/* Pieces */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pieces (optional)</label>
                    <input {...register('pieces', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })}
                      type="number" min="1" className="input-field" placeholder="e.g. 4" />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select {...register('category')} className="input-field">
                      {DISH_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Menu Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Menu Type *</label>
                    <select {...register('menuType')} className="input-field">
                      <option value="DAILY">Daily Menu</option>
                      <option value="FRIDAY">Friday Special</option>
                      <option value="BOTH">Both Menus</option>
                    </select>
                  </div>

                  {/* Spice Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Spice Level *</label>
                    <select {...register('spiceLevel')} className="input-field">
                      <option value="MILD">🌿 Mild</option>
                      <option value="MEDIUM">🌶️ Medium</option>
                      <option value="HOT">🌶️🌶️ Hot</option>
                      <option value="EXTRA_HOT">🌶️🌶️🌶️ Extra Hot</option>
                    </select>
                  </div>

                  {/* Image */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dish Image</label>
                    <div className="flex gap-3 items-start">
                      <div className="flex-1">
                        <input {...register('imageUrl')} className="input-field" placeholder="https://..." />
                      </div>
                      <div className="flex-shrink-0">
                        <label className="btn-secondary cursor-pointer text-sm py-3">
                          <Upload size={16} />
                          {uploading ? 'Uploading...' : 'Upload'}
                          <input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} disabled={uploading} />
                        </label>
                      </div>
                    </div>
                    {imageUrl && (
                      <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Toggles */}
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input {...register('isVegetarian')} type="checkbox" className="w-4 h-4 text-spice-500 rounded" />
                      <span className="text-sm font-medium text-gray-700">🌿 Vegetarian</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input {...register('isAvailable')} type="checkbox" className="w-4 h-4 text-spice-500 rounded" />
                      <span className="text-sm font-medium text-gray-700">✅ Available</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                    {isSubmitting ? 'Saving...' : editing ? 'Update Dish' : 'Create Dish'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-6">
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
