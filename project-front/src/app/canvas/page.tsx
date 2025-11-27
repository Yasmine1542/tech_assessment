"use client";

import { Button } from "@/components/ui/button";
import { useHistory } from "@/hooks/useHistory";
import { PlacedItemData, SavedImage } from "@/lib/api";
import { useDeleteImageMutation } from "@/lib/queries/useDeleteImageMutation";
import { useItemsQuery } from "@/lib/queries/useItemsQuery";
import { useSaveImageMutation } from "@/lib/queries/useSaveImageMutation";
import { useSavedImagesQuery } from "@/lib/queries/useSavedImagesQuery";
import type { Item } from "@/types/item";
import { getItemImageUrl } from "@/types/item";
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import Konva from "konva";
import { Camera, Clock, Download, ImageIcon, Loader2, Redo2, RotateCcw, Save, Sparkles, Trash2, Undo2, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CameraCapture } from "./components/canvas/CameraCapture";
import { CANVAS_DROPPABLE_ID, CanvasStage, DropPreview, PlacedItem } from "./components/canvas/CanvasStage";
import { ItemsPalette } from "./components/canvas/ItemsPalette";
import { ItemsPaletteError } from "./components/canvas/ItemsPaletteError";
import { ItemsPaletteSkeleton } from "./components/canvas/ItemsPaletteSkeleton";
import { MobileHorizontalPalette } from "./components/canvas/MobileHorizontalPalette";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function urlToDataUrl(url: string): Promise<string> {
  const response = await fetch(url, { mode: 'cors' });
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function DroppableCanvas({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({
    id: CANVAS_DROPPABLE_ID,
  });

  return (
    <div
      ref={setNodeRef}
      className="relative flex flex-1 aspect-video md:aspect-auto md:min-h-[520px] overflow-hidden rounded-2xl md:rounded-3xl border border-black/10 bg-black"
    >
      {children}
    </div>
  );
}

export default function CanvasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/canvas");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const [photo, setPhoto] = useState<string | null>(null);

  const {
    data: savedImages = [],
    isLoading: isLoadingSavedImages,
    refetch: refetchSavedImages,
  } = useSavedImagesQuery(session?.accessToken, 4);

  const saveImageMutation = useSaveImageMutation();
  const deleteImageMutation = useDeleteImageMutation();

  const [selectedPaletteItem, setSelectedPaletteItem] = useState<Item | null>(null);

  const {
    state: placedItems,
    setState: setPlacedItems,
    undo,
    redo,
    reset: resetPlacedItems,
    canUndo,
    canRedo,
  } = useHistory<PlacedItem[]>([]);

  const [selectedJewelIds, setSelectedJewelIds] = useState<string[]>([]);

  const [clipboard, setClipboard] = useState<PlacedItem | null>(null);
  
  const pasteCountRef = useRef(0);

  const [activeDragItem, setActiveDragItem] = useState<Item | null>(null);

  const [dropPreview, setDropPreview] = useState<DropPreview>(null);

  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const stageRef = useRef<Konva.Stage | null>(null);

  const isSaving = saveImageMutation.isPending;
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        mousePositionRef.current = { x: touch.clientX, y: touch.clientY };
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        mousePositionRef.current = { x: touch.clientX, y: touch.clientY };
      }
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchstart", handleTouchStart);
    };
  }, []);

  const { data: items, isLoading, isError, error, refetch } = useItemsQuery();

  const itemsById = useMemo(() => {
    const map: Record<string, Item> = {};
    (items ?? []).forEach((i) => (map[i.id] = i));
    return map;
  }, [items]);

  const handleSelectPaletteItem = (item: Item) => {
    setSelectedPaletteItem(item);
  };

  const handleCapture = (dataUrl: string) => {
    setPhoto(dataUrl);
  };

  const handleRetakePhoto = () => {
    setPhoto(null);
    setSelectedPaletteItem(null);
    resetPlacedItems();
    setSelectedJewelIds([]);
  };

  const handleMoveItem = useCallback(
    (id: string, pos: { x: number; y: number }) => {
      setPlacedItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, x: pos.x, y: pos.y } : item
        )
      );
    },
    []
  );

  const handleUpdateItem = useCallback(
    (id: string, updates: Partial<PlacedItem>) => {
      setPlacedItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        )
      );
      setDropPreview(null);
    },
    []
  );

  const handleMoveMultiple = useCallback(
    (ids: string[], delta: { dx: number; dy: number }) => {
      setPlacedItems((prev) =>
        prev.map((item) =>
          ids.includes(item.id)
            ? { ...item, x: item.x + delta.dx, y: item.y + delta.dy }
            : item
        )
      );
    },
    [setPlacedItems]
  );

  const handleSelectJewels = useCallback((ids: string[]) => {
    setSelectedJewelIds(ids);
    setDropPreview(null);
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (selectedJewelIds.length === 0) return;
    setPlacedItems((prev) => prev.filter((item) => !selectedJewelIds.includes(item.id)));
    setSelectedJewelIds([]);
  }, [selectedJewelIds, setPlacedItems]);

  const handleCopy = useCallback(() => {
    if (selectedJewelIds.length === 0) return;
    const selectedItem = placedItems.find((item) => item.id === selectedJewelIds[0]);
    if (selectedItem) {
      setClipboard({ ...selectedItem });
      pasteCountRef.current = 0;
    }
  }, [selectedJewelIds, placedItems]);

  const handleCut = useCallback(() => {
    if (selectedJewelIds.length === 0) return;
    const selectedItem = placedItems.find((item) => item.id === selectedJewelIds[0]);
    if (selectedItem) {
      setClipboard({ ...selectedItem });
      pasteCountRef.current = 0;
      setPlacedItems((prev) => prev.filter((item) => !selectedJewelIds.includes(item.id)));
      setSelectedJewelIds([]);
    }
  }, [selectedJewelIds, placedItems, setPlacedItems]);

  const handlePaste = useCallback(() => {
    if (!clipboard) return;
    
    pasteCountRef.current += 1;
    const offset = pasteCountRef.current * 20;
    
    const newItem: PlacedItem = {
      ...clipboard,
      id: `${clipboard.itemId}-${Date.now()}`,
      x: clipboard.x + offset,
      y: clipboard.y + offset,
    };
    
    setPlacedItems((prev) => [...prev, newItem]);
    setSelectedJewelIds([newItem.id]);
  }, [clipboard, setPlacedItems]);

  const handleSelectAll = useCallback(() => {
    setSelectedJewelIds(placedItems.map(item => item.id));
  }, [placedItems]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && e.key === "c") {
        e.preventDefault();
        handleCopy();
      } else if (isCtrlOrCmd && e.key === "x") {
        e.preventDefault();
        handleCut();
      } else if (isCtrlOrCmd && e.key === "v") {
        e.preventDefault();
        handlePaste();
      } else if (isCtrlOrCmd && e.key === "a") {
        e.preventDefault();
        handleSelectAll();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDeleteSelected();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSelectedJewelIds([]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCopy, handleCut, handlePaste, handleSelectAll, handleDeleteSelected]);

  const getCanvasImageDataUrl = useCallback((): string | null => {
    const stage = stageRef.current;
    if (!stage) return null;

    setSelectedJewelIds([]);

    return stage.toDataURL({
      pixelRatio: 2,
      mimeType: 'image/png',
    });
  }, []);

  const handleDownload = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    setSelectedJewelIds([]);

    setTimeout(() => {
      const dataUrl = stage.toDataURL({
        pixelRatio: 2,
        mimeType: 'image/png',
      });

      const link = document.createElement('a');
      link.download = `dental-jewel-preview-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 50);
  }, []);

  const handleSaveToProfile = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage) return;

    if (!session?.accessToken) {
      setSaveMessage({ type: 'error', text: 'Please log in to save' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setSelectedJewelIds([]);

    try {
      await new Promise(resolve => setTimeout(resolve, 50));

      const dataUrl = stage.toDataURL({
        pixelRatio: 2,
        mimeType: 'image/png',
      });

      const name = `Dental Preview - ${new Date().toLocaleDateString()}`;
      const placedItemsData: PlacedItemData[] = placedItems.map(item => ({
        id: item.id,
        itemId: item.itemId,
        x: item.x,
        y: item.y,
        size: item.size,
        rotation: item.rotation,
      }));

      await saveImageMutation.mutateAsync({
        name,
        imageData: dataUrl,
        token: session.accessToken,
        placedItems: placedItemsData,
      });

      setSaveMessage({ type: 'success', text: 'Saved to profile!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save. Please try again.' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }, [session?.accessToken, placedItems, saveImageMutation]);

  const [isLoadingSavedImage, setIsLoadingSavedImage] = useState(false);
  
  const handleLoadSavedImage = useCallback(async (savedImage: SavedImage) => {
    setIsLoadingSavedImage(true);
    try {
      const imageUrl = `${API_URL}/uploads/${savedImage.imagePath}`;
      const dataUrl = await urlToDataUrl(imageUrl);
      setPhoto(dataUrl);
      if (savedImage.placedItems && Array.isArray(savedImage.placedItems)) {
        setPlacedItems(savedImage.placedItems as PlacedItem[]);
      } else {
        resetPlacedItems();
      }
    } catch (error) {
      console.error('Failed to load saved image:', error);
      setSaveMessage({ type: 'error', text: 'Failed to load image' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsLoadingSavedImage(false);
    }
  }, [resetPlacedItems, setPlacedItems]);

  const handleDeleteSavedImage = useCallback(async (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation();
    
    if (!session?.accessToken) return;
    
    try {
      await deleteImageMutation.mutateAsync({
        id: imageId,
        token: session.accessToken,
      });
      setSaveMessage({ type: 'success', text: 'Image deleted' });
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      console.error('Failed to delete saved image:', error);
      setSaveMessage({ type: 'error', text: 'Failed to delete' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }, [session?.accessToken, deleteImageMutation]);

  const getCanvasPositionFromMouse = useCallback((): { x: number; y: number } | null => {
    const stage = stageRef.current;
    if (!stage) return null;

    const container = stage.container();
    if (!container) return null;

    const containerRect = container.getBoundingClientRect();
    const mousePos = mousePositionRef.current;

    const x = mousePos.x - containerRect.left;
    const y = mousePos.y - containerRect.top;

    return { x, y };
  }, []);

  const getResponsiveJewelSize = useCallback((defaultSize: number): number => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return Math.max(30, Math.round(defaultSize * 0.6));
    }
    return defaultSize;
  }, []);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const draggedItem = event.active.data.current?.item as Item | undefined;
      if (draggedItem) {
        setActiveDragItem(draggedItem);
      }
    },
    []
  );

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const { over } = event;
      const draggedItem = event.active.data.current?.item as Item | undefined;

      if (!over || over.id !== CANVAS_DROPPABLE_ID || !draggedItem) {
        setDropPreview(null);
        return;
      }

      const pos = getCanvasPositionFromMouse();
      if (!pos) {
        setDropPreview(null);
        return;
      }

      const size = getResponsiveJewelSize(draggedItem.defaultSize);
      setDropPreview({
        itemId: draggedItem.id,
        x: pos.x - size / 2,
        y: pos.y - size / 2,
        size,
      });
    },
    [getCanvasPositionFromMouse, getResponsiveJewelSize]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { over } = event;

      setActiveDragItem(null);
      setDropPreview(null);

      if (!over || over.id !== CANVAS_DROPPABLE_ID) {
        return;
      }

      const draggedItem = event.active.data.current?.item as Item | undefined;
      if (!draggedItem) {
        return;
      }

      const pos = getCanvasPositionFromMouse();
      if (!pos) {
        return;
      }

      const size = getResponsiveJewelSize(draggedItem.defaultSize);
      const newPlacedItem: PlacedItem = {
        id: crypto.randomUUID(),
        itemId: draggedItem.id,
        x: pos.x - size / 2,
        y: pos.y - size / 2,
        size,
        rotation: 0,
      };

      setPlacedItems((prev) => [...prev, newPlacedItem]);
    },
    [getCanvasPositionFromMouse, getResponsiveJewelSize]
  );

  if (!photo) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-linear-to-br from-violet-50/50 via-white to-purple-50/30">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
          {/* Page Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step 1 of 2</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
              Capture Your Smile
            </h1>
            <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto">
              Take a photo or upload an image to start previewing dental jewelry
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Camera Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm shadow-gray-200/50 overflow-hidden">
                {/* Camera Header */}
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <h2 className="font-medium text-gray-900">Camera</h2>
                      <p className="text-xs text-gray-500">Position your smile in the frame</p>
                    </div>
                  </div>
                </div>
                
                {/* Camera Component */}
                <div className="p-4 sm:p-6">
                  <CameraCapture onCapture={handleCapture} />
                </div>
              </div>
            </div>

            {/* Sidebar - Recent Saves */}
            <div className="lg:col-span-1 space-y-6">
              {/* Recent Saves Card */}
              {session && (
                <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm shadow-gray-200/50 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h2 className="font-medium text-gray-900">Recent Saves</h2>
                        <p className="text-xs text-gray-500">Continue where you left off</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {isLoadingSavedImages || isLoadingSavedImage ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                      </div>
                    ) : savedImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {savedImages.map((image) => (
                          <div
                            key={image.id}
                            className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-transparent hover:border-violet-400 transition-all duration-200 hover:shadow-lg hover:shadow-violet-100"
                          >
                            <button
                              onClick={() => handleLoadSavedImage(image)}
                              className="absolute inset-0 w-full h-full"
                            >
                              <Image
                                src={`${API_URL}/uploads/${image.imagePath}`}
                                alt={image.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </button>
                            {/* Delete button */}
                            <button
                              onClick={(e) => handleDeleteSavedImage(e, image.id)}
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                              title="Delete image"
                            >
                              <X className="w-3.5 h-3.5 text-white" />
                            </button>
                            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                              <p className="text-[10px] text-white font-medium truncate">
                                {new Date(image.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">No saved images yet</p>
                        <p className="text-xs text-gray-400 mt-1">Your creations will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tips Card */}
              <div className="bg-linear-to-br from-violet-500 to-purple-600 rounded-3xl p-5 text-white">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Pro Tips
                </h3>
                <ul className="space-y-2 text-sm text-white/90">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/60 mt-1.5 shrink-0" />
                    Good lighting helps capture details
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/60 mt-1.5 shrink-0" />
                    Center your smile in the frame
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/60 mt-1.5 shrink-0" />
                    You can also upload existing photos
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedJewel = selectedJewelIds.length > 0
    ? placedItems.find((p) => p.id === selectedJewelIds[0])
    : null;
  const selectedJewelItem = selectedJewel
    ? itemsById[selectedJewel.itemId]
    : null;

  return (
    <DndContext onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
      <div className="min-h-[calc(100vh-80px)] bg-linear-to-br from-gray-50 via-white to-violet-50/30">
        {/* Top Bar */}
        <div className="border-b border-gray-200/80 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Step 2 of 2</span>
              </div>
              <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">Design Your Look</h1>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Undo/Redo */}
              {(canUndo || canRedo) && (
                <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-1 py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={undo}
                    disabled={!canUndo}
                    className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 rounded-lg"
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={redo}
                    disabled={!canRedo}
                    className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 rounded-lg"
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo2 className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="h-6 w-px bg-gray-200 hidden sm:block" />
              
              {/* Download & Save */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="h-9 px-3 gap-2 text-gray-600 border-gray-200 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
                {session && (
                  <Button
                    size="sm"
                    onClick={handleSaveToProfile}
                    disabled={isSaving}
                    className="h-9 px-3 gap-2 bg-violet-600 hover:bg-violet-700"
                  >
                    <Save className={`h-4 w-4 ${isSaving ? 'animate-pulse' : ''}`} />
                    <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Message Toast */}
        {saveMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className={`rounded-xl px-4 py-3 shadow-lg ${
              saveMessage.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}>
              {saveMessage.text}
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Left Panel - Items Palette (hidden on mobile) */}
            <div className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-24 bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="font-medium text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    Jewelry Collection
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Drag items onto your photo</p>
                </div>
                
                <div className="p-4 max-h-[calc(100vh-220px)] overflow-y-auto">
                  {isLoading && <ItemsPaletteSkeleton />}

                  {isError && (
                    <ItemsPaletteError
                      message={error instanceof Error ? error.message : "Failed to load items"}
                      onRetry={() => refetch()}
                    />
                  )}

                  {items && !isLoading && !isError && (
                    <ItemsPalette
                      items={items}
                      selectedItemId={selectedPaletteItem?.id}
                      onSelect={handleSelectPaletteItem}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
              {/* Canvas Container */}
              <div className="relative bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <DroppableCanvas>
                  <CanvasStage
                    photoDataUrl={photo}
                    placedItems={placedItems}
                    itemsById={itemsById}
                    onMoveItem={handleMoveItem}
                    onUpdateItem={handleUpdateItem}
                    selectedIds={selectedJewelIds}
                    onSelect={handleSelectJewels}
                    onDeleteSelected={handleDeleteSelected}
                    dropPreview={dropPreview}
                    isDraggingFromPalette={activeDragItem !== null}
                    stageRef={stageRef}
                    onMoveMultiple={handleMoveMultiple}
                  />

                  {/* Retake photo button - top left */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetakePhoto}
                    className="absolute left-3 top-3 z-20 border-white/20 bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white text-xs"
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    New Photo
                  </Button>

                  {/* Selection toolbar - top right */}
                  {selectedJewelIds.length > 0 && (
                    <div className="absolute right-3 top-3 z-20">
                      <div className="flex items-center gap-2 rounded-xl bg-black/40 backdrop-blur-sm px-3 py-2">
                        <span className="text-xs text-white font-medium">
                          {selectedJewelIds.length === 1 && selectedJewelItem 
                            ? selectedJewelItem.name 
                            : `${selectedJewelIds.length} selected`}
                        </span>
                        <div className="h-4 w-px bg-white/30" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleDeleteSelected}
                          className="h-7 w-7 p-0 text-white hover:bg-red-500/80 hover:text-white rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Helper text - bottom center */}
                  <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
                    <div className="rounded-xl bg-black/40 backdrop-blur-sm px-4 py-2 text-center">
                      {selectedJewelIds.length > 0 ? (
                        <p className="text-xs text-white">
                          {selectedJewelIds.length > 1 ? "Drag to move together" : "Drag corners to resize • Rotate handle to spin"}
                        </p>
                      ) : placedItems.length > 0 ? (
                        <p className="text-xs text-white">
                          <span className="font-medium">{placedItems.length}</span> jewel{placedItems.length !== 1 ? "s" : ""} placed • Tap to select
                        </p>
                      ) : (
                        <p className="text-xs text-white/80">
                          Drag jewelry from the panel onto your smile
                        </p>
                      )}
                    </div>
                  </div>
                </DroppableCanvas>
              </div>

              {/* Mobile Horizontal Items Palette */}
              <div className="lg:hidden bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="font-medium text-gray-900 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    Jewelry
                  </h2>
                  <span className="text-xs text-gray-400">← Swipe →</span>
                </div>
                
                <div className="overflow-x-auto overflow-y-hidden scrollbar-hide">
                  <div className="flex gap-2 p-3 min-w-max">
                    {isLoading && (
                      <div className="flex gap-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-16 w-16 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                        ))}
                      </div>
                    )}

                    {isError && (
                      <div className="flex items-center gap-2 px-3 py-2">
                        <span className="text-xs text-red-500">Failed to load</span>
                        <Button size="sm" variant="ghost" onClick={() => refetch()} className="text-xs h-7">
                          Retry
                        </Button>
                      </div>
                    )}

                    {items && !isLoading && !isError && (
                      <MobileHorizontalPalette
                        items={items}
                        selectedItemId={selectedPaletteItem?.id}
                        onSelect={handleSelectPaletteItem}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
        {activeDragItem ? (
          <DragOverlayContent item={activeDragItem} getResponsiveSize={getResponsiveJewelSize} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function DragOverlayContent({ 
  item, 
  getResponsiveSize 
}: { 
  item: Item; 
  getResponsiveSize: (size: number) => number;
}) {
  const size = getResponsiveSize(item.defaultSize);
  
  return (
    <div 
      className="cursor-grabbing"
      style={{ 
        width: size, 
        height: size,
        position: 'relative'
      }}
    >
      <Image
        src={getItemImageUrl(item)}
        alt={item.name}
        fill
        className="object-contain pointer-events-none select-none drop-shadow-lg"
        draggable={false}
        sizes={`${size}px`}
      />
    </div>
  );
}
