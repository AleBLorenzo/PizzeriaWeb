"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

/**
 * 🛠️ PÁGINA DE ADMINISTRACIÓN — /admin
 *
 * ¿Qué hace esta página?
 * Permite crear, editar y eliminar productos de la pizzería (CRUD completo).
 * CRUD = Create, Read, Update, Delete — las 4 operaciones básicas de cualquier BD.
 *
 * CONCEPTOS NUEVOS que aprenderás aquí:
 *
 * 1. PROTECCIÓN DE RUTA en el propio componente (además del middleware)
 *    → Comprobamos si el usuario es admin antes de mostrar nada
 *
 * 2. FORMULARIO CONTROLADO con un solo estado objeto
 *    → En vez de useState por cada campo, un solo useState({ name, price, ... })
 *
 * 3. MODO DUAL: crear vs editar
 *    → El mismo formulario sirve para crear y para editar según si hay un
 *      producto seleccionado (editingProduct) o no
 *
 * 4. OPERACIONES CRUD en Supabase:
 *    → .insert() para crear
 *    → .update().eq() para editar
 *    → .delete().eq() para eliminar
 *
 * 5. OPTIMISTIC UI (parcial)
 *    → Actualizamos el estado local inmediatamente sin esperar a refetch
 */

// ─────────────────────────────────────────────
// CONFIGURACIÓN: emails que tienen acceso a /admin
// En producción esto estaría en una tabla "roles" en Supabase,
// pero para aprender, una lista simple es suficiente.
// ─────────────────────────────────────────────
const ADMIN_EMAILS = ["admin@pizzeria.com", "alejandrobl0819@gmail.com"]; // 👈 cambia esto por tu email

// ─────────────────────────────────────────────
// ESTADO INICIAL del formulario
// Lo sacamos como constante para poder hacer "reset" fácilmente
// después de crear/editar un producto.
// ─────────────────────────────────────────────
const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  image_url: "",
};

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Estado del formulario: UN SOLO OBJETO en vez de 4 useState separados
  // Ventaja: puedes hacer reset con setForm(EMPTY_FORM) en una línea
  const [form, setForm] = useState(EMPTY_FORM);

  // Si editingProduct tiene valor, el formulario está en modo "editar"
  // Si es null, está en modo "crear"
  const [editingProduct, setEditingProduct] = useState(null);

  const [saving, setSaving] = useState(false);    // ¿Guardando en BD?
  const [deletingId, setDeletingId] = useState(null); // ID del producto borrándose
  const [toast, setToast] = useState(null);

  const router = useRouter();

  // ─────────────────────────────────────────────
  // PROTECCIÓN DE RUTA
  // El middleware redirige si no hay sesión, pero aquí añadimos
  // una segunda capa: verificamos que el usuario sea admin.
  // ─────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const currentUser = data.session?.user;
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }
      if (!ADMIN_EMAILS.includes(currentUser.email)) {
        // No es admin: redirige al menú principal
        router.push("/");
        return;
      }
      setUser(currentUser);
      setAuthLoading(false);
    });
  }, [router]);

  // ─────────────────────────────────────────────
  // CARGAR PRODUCTOS
  // ─────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false }); // Los más nuevos primero

    if (!error) setProducts(data || []);
    setLoadingProducts(false);
  }, []);

  useEffect(() => {
    if (!authLoading && user) fetchProducts();
  }, [authLoading, user, fetchProducts]);

  // ─────────────────────────────────────────────
  // HELPER: mostrar notificaciones
  // ─────────────────────────────────────────────
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─────────────────────────────────────────────
  // MANEJAR CAMBIOS EN EL FORMULARIO
  //
  // En vez de tener onChange para cada campo, usamos UN solo handler.
  // e.target.name nos dice QUÉ campo cambió (gracias al atributo name= en el input)
  // ...prev mantiene los valores del resto de campos sin tocarlos
  //
  // Ejemplo: si el usuario escribe en el campo "price":
  //   prev = { name: "Margarita", description: "...", price: "9", image_url: "" }
  //   e.target.name = "price", e.target.value = "9.9"
  //   resultado = { ...prev, price: "9.9" }  ← solo cambia price
  // ─────────────────────────────────────────────
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    //                              ↑ computed property: usa el valor de "name" como clave
  };

  // ─────────────────────────────────────────────
  // ENTRAR EN MODO EDICIÓN
  // Rellenamos el formulario con los datos del producto a editar
  // ─────────────────────────────────────────────
  const startEditing = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(), // El input es texto, convertimos number a string
      image_url: product.image_url || "",
    });
    // Scroll al formulario para que el usuario lo vea
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─────────────────────────────────────────────
  // CANCELAR EDICIÓN: volvemos a modo "crear"
  // ─────────────────────────────────────────────
  const cancelEditing = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
  };

  // ─────────────────────────────────────────────
  // GUARDAR PRODUCTO (crear o actualizar)
  //
  // Un solo handler para ambos modos. La lógica es:
  //   - Si hay editingProduct → UPDATE
  //   - Si no → INSERT
  // ─────────────────────────────────────────────
  const handleSave = async () => {
    // Validación básica del lado cliente
    if (!form.name.trim()) return showToast("El nombre es obligatorio", "error");
    if (!form.price || isNaN(parseFloat(form.price))) {
      return showToast("El precio debe ser un número válido", "error");
    }

    setSaving(true);

    // Preparamos el objeto a guardar
    // parseFloat convierte el string "9.99" al número 9.99
    const productData = {
      name: form.name.trim(),
      description: form.description.trim() || null, // null si está vacío (mejor que string vacío en BD)
      price: parseFloat(form.price),
      image_url: form.image_url.trim() || null,
    };

    try {
      if (editingProduct) {
        // ─── MODO EDITAR: UPDATE ───
        // .update(datos).eq("id", id) → actualiza la fila donde id coincide
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;

        // OPTIMISTIC UI: actualizamos el estado local sin hacer refetch
        // Más rápido que volver a pedir todos los productos a la BD
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id ? { ...p, ...productData } : p
          )
        );

        showToast(`"${productData.name}" actualizado ✅`);
        cancelEditing();
      } else {
        // ─── MODO CREAR: INSERT ───
        // .insert([datos]).select().single() → inserta y devuelve la fila creada
        // Necesitamos la fila creada para obtener el ID que generó Supabase
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert([productData])
          .select()
          .single();

        if (error) throw error;

        // Añadimos el nuevo producto AL PRINCIPIO de la lista (ya que ordenamos desc)
        setProducts((prev) => [newProduct, ...prev]);
        showToast(`"${productData.name}" creado ✅`);
        setForm(EMPTY_FORM); // Limpiar formulario
      }
    } catch (err) {
      console.error(err);
      showToast("Error al guardar. Comprueba los permisos RLS en Supabase.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // ELIMINAR PRODUCTO
  //
  // Guardamos el ID que se está borrando en deletingId para mostrar
  // un estado de carga solo en ESE botón (no en todos)
  // ─────────────────────────────────────────────
  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeletingId(product.id);

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id); // Elimina la fila donde id = product.id

    if (error) {
      showToast("Error al eliminar el producto", "error");
    } else {
      // Quitamos el producto de la lista local sin refetch
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      showToast(`"${product.name}" eliminado`);
    }

    setDeletingId(null);
  };

  // ─────────────────────────────────────────────
  // RENDERS CONDICIONALES
  // ─────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-400 animate-pulse text-lg">Verificando acceso...</div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-10">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl text-white text-sm font-medium animate-fade-in
          ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between mb-10 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Panel Admin 🛠️</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {user?.email} · {products.length} producto(s)
          </p>
        </div>
        <a
          href="/"
          className="text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-4 py-2 rounded-lg transition-colors"
        >
          ← Ver menú
        </a>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* ─── COLUMNA IZQUIERDA: Formulario (ocupa 2/5 del grid) ─── */}
        <aside className="lg:col-span-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-6">

            {/* Título del formulario cambia según el modo */}
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              {editingProduct ? (
                <>✏️ Editando: <span className="text-emerald-400 truncate">{editingProduct.name}</span></>
              ) : (
                <>➕ Nuevo producto</>
              )}
            </h2>

            {/* FORMULARIO */}
            {/* Cada input tiene name= que coincide con la clave en EMPTY_FORM */}
            {/* Así handleFormChange sabe qué campo actualizar */}
            <div className="flex flex-col gap-4">

              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="name"           /* 👈 debe coincidir con la clave en EMPTY_FORM */
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="Pizza Margarita"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500
                             focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Tomate, mozzarella, albahaca..."
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500
                             focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">
                  Precio (€) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleFormChange}
                  placeholder="9.99"
                  step="0.01"   /* Permite decimales de 2 cifras */
                  min="0"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500
                             focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">
                  URL de imagen
                </label>
                <input
                  type="url"
                  name="image_url"
                  value={form.image_url}
                  onChange={handleFormChange}
                  placeholder="https://..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500
                             focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                {/* Preview de la imagen si hay URL */}
                {form.image_url && (
                  <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden border border-zinc-700">
                    <Image
                      src={form.image_url}
                      alt="Preview"
                      fill
                      className="object-cover"
                      // onError oculta el preview si la URL no es válida
                      onError={(e) => e.currentTarget.parentElement.style.display = "none"}
                    />
                  </div>
                )}
              </div>

              {/* Botones del formulario */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-600 disabled:cursor-not-allowed
                             text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  {saving ? "Guardando..." : editingProduct ? "Guardar cambios" : "Crear producto"}
                </button>

                {/* Solo mostramos "Cancelar" cuando estamos editando */}
                {editingProduct && (
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 border border-zinc-600 hover:border-zinc-400 text-zinc-300 hover:text-white rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* ─── COLUMNA DERECHA: Lista de productos (ocupa 3/5 del grid) ─── */}
        <section className="lg:col-span-3">
          <h2 className="text-lg font-semibold mb-4 text-zinc-300">
            Productos actuales
          </h2>

          {loadingProducts ? (
            // Skeleton loading: rectángulos animados como placeholder visual
            // Mejor UX que un spinner porque el usuario ve que habrá tarjetas
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-zinc-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="border-2 border-dashed border-zinc-800 rounded-xl p-12 text-center text-zinc-500">
              <div className="text-4xl mb-3">🍕</div>
              <p>Aún no hay productos.</p>
              <p className="text-sm mt-1">Crea el primero con el formulario.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {products.map((product) => (
                <li
                  key={product.id}
                  className={`bg-zinc-900 border rounded-xl p-4 flex items-center gap-4 transition-colors
                    ${editingProduct?.id === product.id
                      ? "border-emerald-500 shadow-lg shadow-emerald-950" // Resaltar el que se edita
                      : "border-zinc-800 hover:border-zinc-600"
                    }`}
                >
                  {/* Imagen o placeholder */}
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🍕</div>
                    )}
                  </div>

                  {/* Info del producto */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{product.name}</p>
                    {product.description && (
                      <p className="text-zinc-400 text-sm truncate">{product.description}</p>
                    )}
                    <p className="text-emerald-400 font-bold text-sm mt-1">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEditing(product)}
                      className="px-3 py-1.5 text-sm border border-zinc-600 hover:border-emerald-500
                                 text-zinc-300 hover:text-emerald-400 rounded-lg transition-colors"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      disabled={deletingId === product.id}
                      className="px-3 py-1.5 text-sm border border-zinc-600 hover:border-red-500
                                 text-zinc-300 hover:text-red-400 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      {deletingId === product.id ? "..." : "🗑️ Borrar"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}