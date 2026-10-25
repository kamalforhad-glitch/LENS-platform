"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Menu,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Copy,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Laptop,
  Smartphone,
  Search,
  Filter,
  Save,
  X,
  Home,
  Info,
  BookOpen,
  GraduationCap,
  FolderKanban,
  BarChart3,
  Users,
  Calendar,
  PenTool,
  Mail,
  Camera,
  Video,
  TrendingUp,
  Globe,
  Award,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { buildFullMenuTree, type MenuNode, type FlatMenuItem } from "@/lib/site-navigation";

const ICON_OPTIONS: Array<{ name: string; label: string; icon: LucideIcon }> = [
  { name: "", label: "(No Icon)", icon: Menu },
  { name: "home", label: "Home", icon: Home },
  { name: "about", label: "About / Info", icon: Info },
  { name: "research", label: "Research / Chart", icon: BarChart3 },
  { name: "publications", label: "Publications / Book", icon: BookOpen },
  { name: "programs", label: "Programs / Education", icon: GraduationCap },
  { name: "resources", label: "Resources / Folder", icon: FolderKanban },
  { name: "events", label: "Events / Calendar", icon: Calendar },
  { name: "blog", label: "Blog / Pen", icon: PenTool },
  { name: "contact", label: "Contact / Mail", icon: Mail },
  { name: "team", label: "Team / Users", icon: Users },
  { name: "photography", label: "Photography / Camera", icon: Camera },
  { name: "video", label: "Video", icon: Video },
  { name: "check", label: "Check / Verification", icon: CheckCircle2 },
  { name: "trending", label: "Trending / Indexing", icon: TrendingUp },
  { name: "globe", label: "Globe / Network", icon: Globe },
  { name: "award", label: "Award / Shield", icon: Award },
  { name: "layers", label: "Layers / Media", icon: Layers },
];

interface MenuItem extends FlatMenuItem {
  id: string;
  location: string;
  label: string;
  labelBn: string;
  description?: string;
  descriptionBn?: string;
  url: string;
  externalUrl?: string | null;
  sortOrder: number;
  visible: boolean;
  status?: string;
  isClickable?: boolean;
  openSubmenu?: boolean;
  badgeText?: string | null;
  badgeTextBn?: string | null;
  badgeStyle?: string | null;
  icon?: string | null;
  target: string;
  parentId: string | null;
  desktopVisible?: boolean;
  mobileVisible?: boolean;
  roles?: string | null;
  dateCreated?: string;
  dateModified?: string;
}

interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  warning?: string;
}

async function safeApiRequest<T = any>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options?.headers || {}),
      },
    });

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: "Your session has expired or you do not have permission. Please sign in again.",
      };
    }

    const contentType = res.headers.get("content-type") || "";
    let data: any = null;

    if (contentType.includes("application/json")) {
      const text = await res.text();
      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          return {
            ok: false,
            status: res.status,
            data: null,
            error: "Received invalid JSON from server.",
          };
        }
      }
    } else {
      const text = await res.text();
      return {
        ok: false,
        status: res.status,
        data: null,
        error:
          res.status >= 500
            ? `Server error (${res.status}). Please check database migrations or server logs.`
            : `Request failed with status ${res.status}.`,
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data,
        error: data?.error || `Request failed with status ${res.status}.`,
      };
    }

    return {
      ok: true,
      status: res.status,
      data,
      warning: data?.warning,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err instanceof Error ? err.message : "Network request failed",
    };
  }
}

export default function NavigationManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [deleteCascade, setDeleteCascade] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters & display state
  const [locationFilter, setLocationFilter] = useState<"header" | "footer">("header");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewLang, setPreviewLang] = useState<"en" | "bn">("en");

  // Quick Add State
  const [quickItem, setQuickItem] = useState({
    label: "",
    labelBn: "",
    url: "",
    status: "active",
    parentId: "",
  });

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await safeApiRequest<{ items: MenuItem[]; warning?: string }>("/api/admin/menus?location=*");
      if (!res.ok) {
        throw new Error(res.error || "Failed to load menus");
      }
      setItems(res.data?.items || []);
      setWarning(res.warning || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load menus");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const locationItems = useMemo(() => {
    return items.filter((i) => i.location === locationFilter);
  }, [items, locationFilter]);

  const treeNodes = useMemo(() => {
    return buildFullMenuTree(locationItems);
  }, [locationItems]);

  const toggleCollapse = (id: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Quick Add Handler
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickItem.label.trim()) {
      setError("English label is required");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        location: locationFilter,
        label: quickItem.label.trim(),
        labelBn: quickItem.labelBn.trim(),
        url: quickItem.url.trim() || "/",
        status: quickItem.status || "active",
        parentId: quickItem.parentId || null,
        visible: true,
        isClickable: quickItem.status !== "soon",
        openSubmenu: true,
        target: "_self",
        desktopVisible: true,
        mobileVisible: true,
      };

      const res = await safeApiRequest<{ item: MenuItem }>("/api/admin/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(res.error || "Failed to add item");

      setQuickItem({ label: "", labelBn: "", url: "", status: "active", parentId: "" });
      showSuccess(`Added "${res.data?.item?.label || payload.label}" successfully.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Seed standard navigation defaults
  const handleSeedDefaults = async () => {
    if (!confirm(`Initialize standard reference navigation structure for ${locationFilter.toUpperCase()} navigation? This will populate the approved production menus.`)) {
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await safeApiRequest<{ success: boolean; items: MenuItem[] }>("/api/admin/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed_defaults", location: locationFilter }),
      });
      if (!res.ok) throw new Error(res.error || "Failed to seed navigation");
      showSuccess(`Successfully initialized standard ${locationFilter} navigation!`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Seed failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Item (Create or Update)
  const handleSaveItem = async (payload: Partial<MenuItem>) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const method = payload.id ? "PUT" : "POST";
      const res = await safeApiRequest<{ item: MenuItem }>("/api/admin/menus", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(res.error || "Save failed");
      setEditingItem(null);
      showSuccess(payload.id ? "Menu item updated successfully." : "Menu item created successfully.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Visibility
  const toggleVisibility = async (item: MenuItem) => {
    const next = !item.visible;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, visible: next } : i)));
    try {
      const res = await safeApiRequest("/api/admin/menus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, visible: next }),
      });
      if (!res.ok) throw new Error(res.error || "Visibility change failed");
      showSuccess(`Visibility updated for "${item.label}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Visibility change failed");
      await load();
    }
  };

  // Quick Status Switch (Active <-> Soon)
  const handleStatusChange = async (item: MenuItem, newStatus: string) => {
    const isSoon = newStatus === "soon";
    const updatePayload: Record<string, unknown> = {
      id: item.id,
      status: newStatus,
    };
    if (isSoon && !item.badgeText) {
      updatePayload.badgeText = "SOON";
      updatePayload.badgeTextBn = "শীঘ্রই";
      updatePayload.badgeStyle = "gold";
    }
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...updatePayload } : i)));
    try {
      const res = await safeApiRequest("/api/admin/menus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });
      if (!res.ok) throw new Error(res.error || "Status change failed");
      showSuccess(`Status for "${item.label}" changed to ${newStatus.toUpperCase()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status change failed");
      await load();
    }
  };

  // Reordering: Move within siblings
  const handleMove = async (item: MenuItem, direction: -1 | 1) => {
    const siblings = locationItems
      .filter((i) => (i.parentId || null) === (item.parentId || null))
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = siblings.findIndex((i) => i.id === item.id);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= siblings.length) return;

    const swapped = [...siblings];
    [swapped[idx], swapped[swapIdx]] = [swapped[swapIdx], swapped[idx]];

    const reorderedList = swapped.map((s, order) => ({
      id: s.id,
      sortOrder: order,
    }));

    setItems((prev) =>
      prev.map((i) => {
        const found = reorderedList.find((r) => r.id === i.id);
        return found ? { ...i, sortOrder: found.sortOrder } : i;
      })
    );

    try {
      const res = await safeApiRequest("/api/admin/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          location: locationFilter,
          items: reorderedList,
        }),
      });
      if (!res.ok) throw new Error(res.error || "Reorder failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reorder failed");
      await load();
    }
  };

  // Duplicate an item
  const handleDuplicate = async (item: MenuItem) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        location: item.location,
        label: `${item.label} (Copy)`,
        labelBn: item.labelBn ? `${item.labelBn} (কপি)` : "",
        url: item.url,
        status: "draft",
        parentId: item.parentId,
        visible: false,
        isClickable: item.isClickable,
        openSubmenu: item.openSubmenu,
        badgeText: item.badgeText,
        badgeTextBn: item.badgeTextBn,
        badgeStyle: item.badgeStyle,
        icon: item.icon,
        target: item.target,
        desktopVisible: item.desktopVisible,
        mobileVisible: item.mobileVisible,
      };

      const res = await safeApiRequest<{ item: MenuItem }>("/api/admin/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(res.error || "Failed to duplicate item");
      showSuccess(`Duplicated "${item.label}" as draft.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Duplicate failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Item
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await safeApiRequest<{ success: boolean }>("/api/admin/menus", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id, cascade: deleteCascade }),
      });
      if (!res.ok) throw new Error(res.error || "Delete failed");
      showSuccess(`Deleted "${deleteTarget.label}".`);
      setDeleteTarget(null);
      setDeleteCascade(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Count children for delete warning
  const getChildCount = (id: string): number => {
    const directChildren = items.filter((i) => i.parentId === id);
    let total = directChildren.length;
    for (const child of directChildren) {
      total += getChildCount(child.id);
    }
    return total;
  };

  // Render a tree node recursively
  const renderTreeNode = (node: MenuNode, level: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isCollapsed = collapsedNodes.has(node.id);
    const hasEn = Boolean(node.label?.trim());
    const hasBn = Boolean(node.labelBn?.trim());
    const isComplete = hasEn && hasBn;

    // Filter matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesThis =
        node.label.toLowerCase().includes(q) ||
        node.labelBn?.toLowerCase().includes(q) ||
        node.url.toLowerCase().includes(q);
      const matchesChild = (function hasMatchingChild(n: MenuNode): boolean {
        return n.children.some(
          (c) =>
            c.label.toLowerCase().includes(q) ||
            c.labelBn?.toLowerCase().includes(q) ||
            c.url.toLowerCase().includes(q) ||
            hasMatchingChild(c)
        );
      })(node);

      if (!matchesThis && !matchesChild) return null;
    }

    if (statusFilter !== "all" && node.status !== statusFilter) {
      return null;
    }

    return (
      <div key={node.id} className="relative">
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all duration-200 mb-2 ${
            node.visible
              ? "bg-white border-slate-200 shadow-xs hover:border-teal-400 hover:shadow-md"
              : "bg-slate-50 border-slate-200 opacity-60"
          }`}
          style={{ marginLeft: `${level * 24}px` }}
        >
          {/* Left info block */}
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            {/* Expand / Collapse or guide */}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleCollapse(node.id)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title={isCollapsed ? "Expand children" : "Collapse children"}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-teal-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-teal-600" />
                )}
              </button>
            ) : (
              <span className="w-6 h-6 flex items-center justify-center text-slate-300">
                •
              </span>
            )}

            {/* Icon */}
            {node.icon && (
              <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
                {(() => {
                  const IconComp = ICON_OPTIONS.find(
                    (o) => o.name === (node.icon || "").toLowerCase().replace(/^icon-/, "")
                  )?.icon;
                  return IconComp ? <IconComp className="w-4 h-4" /> : <Menu className="w-4 h-4" />;
                })()}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-900 text-sm truncate">{node.label}</p>
                {node.labelBn && (
                  <p className="text-xs text-slate-500 font-bangla truncate">
                    ({node.labelBn})
                  </p>
                )}
                {/* Level badge */}
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                  L{level + 1}
                </span>

                {/* Status Badge */}
                {node.status === "soon" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-300 text-amber-700">
                    SOON {node.badgeText ? `(${node.badgeText})` : ""}
                  </span>
                )}
                {node.status === "draft" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 border border-purple-300 text-purple-700">
                    DRAFT
                  </span>
                )}
                {node.status === "disabled" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-300 text-slate-600">
                    DISABLED
                  </span>
                )}
                {(!node.status || node.status === "active") && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-300 text-emerald-700">
                    ACTIVE
                  </span>
                )}

                {/* Translation completeness */}
                {isComplete ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> EN/BN
                  </span>
                ) : !hasBn ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Missing BN
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Missing EN
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                <span className="font-mono text-teal-600 truncate max-w-xs">{node.url}</span>
                {node.target === "_blank" && (
                  <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                    <ExternalLink className="w-3 h-3" /> New tab
                  </span>
                )}
                {node.isClickable === false && (
                  <span className="text-[10px] text-amber-600 font-medium">(Non-clickable)</span>
                )}
                {hasChildren && (
                  <span className="text-[10px] text-slate-400">
                    ({node.children.length} {node.children.length === 1 ? "child" : "children"})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right action controls */}
          <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-center shrink-0">
            {/* Quick status switch */}
            <select
              value={node.status || "active"}
              onChange={(e) => handleStatusChange(node as unknown as MenuItem, e.target.value)}
              className="text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
              title="Change status"
            >
              <option value="active">Active</option>
              <option value="soon">Coming Soon</option>
              <option value="draft">Draft</option>
              <option value="disabled">Disabled</option>
            </select>

            {/* Quick visible toggle */}
            <button
              type="button"
              onClick={() => toggleVisibility(node as unknown as MenuItem)}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                node.visible
                  ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  : "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
              }`}
              title={node.visible ? "Hide from public navigation" : "Show in public navigation"}
            >
              {node.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            {/* Reorder Up / Down */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
              <button
                type="button"
                onClick={() => handleMove(node as unknown as MenuItem, -1)}
                className="p-1.5 hover:bg-white text-slate-600 hover:text-teal-600 transition-colors"
                title="Move Up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleMove(node as unknown as MenuItem, 1)}
                className="p-1.5 hover:bg-white text-slate-600 hover:text-teal-600 transition-colors border-l border-slate-200"
                title="Move Down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add Child */}
            <button
              type="button"
              onClick={() => {
                setEditingItem({
                  id: "",
                  location: node.location || locationFilter,
                  label: "",
                  labelBn: "",
                  description: "",
                  descriptionBn: "",
                  url: "/",
                  status: "active",
                  sortOrder: node.children.length,
                  visible: true,
                  isClickable: true,
                  openSubmenu: true,
                  target: "_self",
                  parentId: node.id,
                  desktopVisible: true,
                  mobileVisible: true,
                });
              }}
              className="p-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
              title="Add nested child item"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {/* Duplicate */}
            <button
              type="button"
              onClick={() => handleDuplicate(node as unknown as MenuItem)}
              className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
              title="Duplicate item"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            {/* Edit */}
            <button
              type="button"
              onClick={() => setEditingItem(node as unknown as MenuItem)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-teal-500 hover:text-teal-600 transition-colors"
              title="Edit full properties"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => {
                setDeleteTarget(node as unknown as MenuItem);
                setDeleteCascade(false);
              }}
              className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              title="Delete menu item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Children rendering */}
        {hasChildren && !isCollapsed && (
          <div className="relative pl-2">
            {node.children.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Menu className="w-6 h-6 text-teal-600" />
            Navigation &amp; Menu Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete bilingual visual navigation hierarchy manager. Control header menus, nested dropdowns, badges, and statuses independently without code deploys.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview Toggle */}
          <button
            type="button"
            onClick={() => setPreviewOpen(!previewOpen)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              previewOpen
                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Laptop className="w-4 h-4" />
            {previewOpen ? "Close Preview" : "Interactive Preview"}
          </button>

          {/* Seed Defaults */}
          <button
            type="button"
            onClick={handleSeedDefaults}
            disabled={isSubmitting}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-gold-400 hover:text-gold-700 transition-colors flex items-center gap-1.5"
            title="Populate or reset standard LENS production navigation"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gold-600" />
            Seed Reference Menu
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {warning && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            {warning}
          </span>
          <button type="button" onClick={() => setWarning(null)} className="text-amber-600 hover:text-amber-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {success}
          </span>
          <button type="button" onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Location Tabs & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Location selector */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 w-fit">
          <button
            type="button"
            onClick={() => setLocationFilter("header")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              locationFilter === "header"
                ? "bg-white text-teal-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Header Navigation ({items.filter((i) => i.location === "header").length})
          </button>
          <button
            type="button"
            onClick={() => setLocationFilter("footer")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              locationFilter === "footer"
                ? "bg-white text-teal-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Footer Links ({items.filter((i) => i.location === "footer").length})
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search labels or URLs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 w-48 sm:w-64 focus:outline-teal-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="soon">Coming Soon</option>
              <option value="draft">Draft Only</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingItem({
                id: "",
                location: locationFilter,
                label: "",
                labelBn: "",
                description: "",
                descriptionBn: "",
                url: "/",
                status: "active",
                sortOrder: locationItems.length,
                visible: true,
                isClickable: true,
                openSubmenu: true,
                target: "_self",
                parentId: null,
                desktopVisible: true,
                mobileVisible: true,
              });
            }}
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Top-Level Item
          </button>
        </div>
      </div>

      {/* Quick Add Form (Preserves exact E2E selectors) */}
      <form
        onSubmit={handleQuickAdd}
        className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
      >
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
            Label (EN)
          </label>
          <input
            type="text"
            placeholder="Label (EN)"
            value={quickItem.label}
            onChange={(e) => setQuickItem({ ...quickItem, label: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-teal-500"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
            Label (বাংলা)
          </label>
          <input
            type="text"
            placeholder="Label (বাংলা)"
            value={quickItem.labelBn}
            onChange={(e) => setQuickItem({ ...quickItem, labelBn: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bangla focus:outline-teal-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
            URL
          </label>
          <input
            type="text"
            placeholder="URL (/path or https://…)"
            value={quickItem.url}
            onChange={(e) => setQuickItem({ ...quickItem, url: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-teal-500"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
            Parent Menu
          </label>
          <select
            value={quickItem.parentId}
            onChange={(e) => setQuickItem({ ...quickItem, parentId: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-teal-500"
          >
            <option value="">(Top-level Item)</option>
            {locationItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} {item.labelBn ? `(${item.labelBn})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add item
          </button>
        </div>
      </form>

      {/* Main Content: Tree View + Optional Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Tree Container */}
        <div className={previewOpen ? "lg:col-span-7" : "lg:col-span-12"}>
          <div className="bg-slate-50/50 rounded-2xl border border-slate-200 p-4 min-h-[400px]">
            {loading ? (
              <div className="p-12 text-center text-slate-400">Loading navigation tree...</div>
            ) : treeNodes.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <p className="text-slate-500 text-sm">
                  No menu items found in {locationFilter} navigation.
                </p>
                <button
                  type="button"
                  onClick={handleSeedDefaults}
                  className="px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Seed Reference Structure
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {treeNodes.map((rootNode) => renderTreeNode(rootNode, 0))}
              </div>
            )}
          </div>
        </div>

        {/* Live Interactive Preview Panel */}
        {previewOpen && (
          <div className="lg:col-span-5 sticky top-24 bg-navy-950 text-white rounded-2xl border border-white/10 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold tracking-wide">Public Live Preview</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewLang(previewLang === "en" ? "bn" : "en")}
                  className="px-2 py-0.5 rounded text-xs bg-white/10 hover:bg-white/20 text-white font-mono"
                >
                  {previewLang === "en" ? "EN 🇺🇸" : "বাংলা 🇧🇩"}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice(previewDevice === "desktop" ? "mobile" : "desktop")}
                  className="p-1 rounded text-white/60 hover:text-white"
                  title="Toggle device size"
                >
                  {previewDevice === "desktop" ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="text-white/50 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Simulated Header Navigation Bar */}
            <div className="rounded-xl border border-white/10 bg-navy-900/90 p-3 overflow-x-auto">
              <p className="text-[10px] text-teal-300 font-mono mb-2 uppercase tracking-wider">
                Simulated {locationFilter === "header" ? "Navbar" : "Footer"} ({previewLang.toUpperCase()})
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {treeNodes
                  .filter((n) => n.visible && n.status !== "draft" && n.status !== "disabled")
                  .map((item) => {
                    const label = previewLang === "bn" ? item.labelBn || item.label : item.label;
                    const isSoon = item.status === "soon";
                    return (
                      <div
                        key={item.id}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 text-slate-200 flex items-center gap-1.5"
                      >
                        <span>{label}</span>
                        {isSoon && (
                          <span className="text-[9px] px-1 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/30 font-semibold">
                            {previewLang === "bn" ? "শীঘ্রই" : "SOON"}
                          </span>
                        )}
                        {item.children.length > 0 && <ChevronDown className="w-3 h-3 text-white/40" />}
                      </div>
                    );
                  })}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              * Changes published here are immediately delivered to the public navigation via layout cache revalidation.
            </p>
          </div>
        )}
      </div>

      {/* Comprehensive Edit / Add Modal Drawer */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                {editingItem.id ? "Edit Navigation Item" : "New Navigation Item"}
              </h2>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveItem(editingItem);
              }}
              className="space-y-4"
            >
              {/* English & Bangla Labels */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Label (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.label}
                    onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Label (Bangla)
                  </label>
                  <input
                    type="text"
                    value={editingItem.labelBn || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, labelBn: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bangla focus:outline-teal-500"
                  />
                </div>
              </div>

              {/* URL & External URL */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Internal Path / URL *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.url}
                    onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    External URL (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editingItem.externalUrl || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, externalUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:outline-teal-500"
                  />
                </div>
              </div>

              {/* Parent Selector & Status */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Parent Navigation Item
                  </label>
                  <select
                    value={editingItem.parentId || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        parentId: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-teal-500"
                  >
                    <option value="">(Top-level Item)</option>
                    {locationItems
                      .filter((i) => i.id !== editingItem.id) // Avoid self as parent
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label} {item.labelBn ? `(${item.labelBn})` : ""}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Publishing Status
                  </label>
                  <select
                    value={editingItem.status || "active"}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        status: e.target.value,
                        // Auto-fill default Soon badge if changing to soon
                        ...(e.target.value === "soon" && !editingItem.badgeText
                          ? { badgeText: "SOON", badgeTextBn: "শীঘ্রই", badgeStyle: "gold", isClickable: false }
                          : {}),
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-teal-500"
                  >
                    <option value="active">Active (Published normally)</option>
                    <option value="soon">Coming Soon (Displays badge, non-404)</option>
                    <option value="draft">Draft (Hidden publicly, visible in CMS)</option>
                    <option value="disabled">Disabled (Preserved but inactive)</option>
                  </select>
                </div>
              </div>

              {/* Badge configuration */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Status Badge Customization
                </span>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Badge Text (EN)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SOON, NEW"
                      value={editingItem.badgeText || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, badgeText: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Badge Text (BN)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. শীঘ্রই"
                      value={editingItem.badgeTextBn || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, badgeTextBn: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bangla"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Badge Style
                    </label>
                    <select
                      value={editingItem.badgeStyle || "gold"}
                      onChange={(e) => setEditingItem({ ...editingItem, badgeStyle: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="gold">Gold Accent</option>
                      <option value="teal">Teal Brand</option>
                      <option value="blue">Blue Info</option>
                      <option value="slate">Slate Neutral</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Icon & Target */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Menu Icon
                  </label>
                  <select
                    value={editingItem.icon || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, icon: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.name} value={opt.name}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Open Destination In
                  </label>
                  <select
                    value={editingItem.target || "_self"}
                    onChange={(e) => setEditingItem({ ...editingItem, target: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="_self">Same tab (_self)</option>
                    <option value="_blank">New tab (_blank)</option>
                  </select>
                </div>
              </div>

              {/* Toggles: Visibility & Clickable */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.visible !== false}
                    onChange={(e) => setEditingItem({ ...editingItem, visible: e.target.checked })}
                    className="rounded-sm text-teal-600 focus:ring-teal-500"
                  />
                  <span>Visible to Public</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.isClickable !== false}
                    onChange={(e) => setEditingItem({ ...editingItem, isClickable: e.target.checked })}
                    className="rounded-sm text-teal-600 focus:ring-teal-500"
                  />
                  <span>Is Clickable Link</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.desktopVisible !== false}
                    onChange={(e) => setEditingItem({ ...editingItem, desktopVisible: e.target.checked })}
                    className="rounded-sm text-teal-600 focus:ring-teal-500"
                  />
                  <span>Desktop Navbar</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.mobileVisible !== false}
                    onChange={(e) => setEditingItem({ ...editingItem, mobileVisible: e.target.checked })}
                    className="rounded-sm text-teal-600 focus:ring-teal-500"
                  />
                  <span>Mobile Drawer</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? "Saving..." : "Save Navigation Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Reparent vs Cascade Option */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Delete Menu Item?</h3>
                <p className="text-xs text-slate-500">&ldquo;{deleteTarget.label}&rdquo;</p>
              </div>
            </div>

            {getChildCount(deleteTarget.id) > 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  This item has {getChildCount(deleteTarget.id)} nested child item(s).
                </p>
                <div className="space-y-1.5 pt-1 text-xs text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deletePolicy"
                      checked={!deleteCascade}
                      onChange={() => setDeleteCascade(false)}
                      className="text-teal-600"
                    />
                    <span>Move child items up to current parent (Preserve children)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-red-700">
                    <input
                      type="radio"
                      name="deletePolicy"
                      checked={deleteCascade}
                      onChange={() => setDeleteCascade(true)}
                      className="text-red-600"
                    />
                    <span>Cascade delete this item and ALL of its children</span>
                  </label>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed">
                Are you sure you want to delete this menu item? This action will remove it from public navigation immediately.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {isSubmitting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
