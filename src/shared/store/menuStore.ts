import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { menuConfig, fetchMenuFromApi } from '@/shared/config/menu';
import type { MenuItem, FlatMenuItem } from '@/shared/types/menu.types';

export const useMenuStore = defineStore('menu', () => {
  const menus = ref<MenuItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const visibleMenus = computed<MenuItem[]>(() => {
    const filterHidden = (items: MenuItem[]): MenuItem[] => {
      return items
        .filter((item) => !item.meta?.hidden)
        .map((item) => ({
          ...item,
          children: item.children ? filterHidden(item.children) : undefined,
        }));
    };
    return filterHidden(menus.value);
  });

  const flatMenus = computed<FlatMenuItem[]>(() => {
    const flatten = (items: MenuItem[], parentId?: string, level = 0): FlatMenuItem[] => {
      const result: FlatMenuItem[] = [];
      
      items.forEach((item) => {
        const flatItem: FlatMenuItem = {
          ...item,
          parentId,
          level,
        };
        result.push(flatItem);
        
        if (item.children && item.children.length > 0) {
          result.push(...flatten(item.children, item.id, level + 1));
        }
      });
      
      return result;
    };
    
    return flatten(menus.value);
  });

  const menuPaths = computed<string[]>(() => {
    return flatMenus.value
      .map((item) => item.path)
      .filter((path): path is string => !!path);
  });

  const loadMenus = async (fromApi = false): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      if (fromApi) {
        menus.value = await fetchMenuFromApi();
      } else {
        menus.value = menuConfig;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load menus';
      menus.value = menuConfig;
    } finally {
      loading.value = false;
    }
  };

  const findMenuByPath = (path: string): MenuItem | undefined => {
    return flatMenus.value.find((item) => item.path === path);
  };

  const getParentMenus = (path: string): FlatMenuItem[] => {
    const result: FlatMenuItem[] = [];
    const current = flatMenus.value.find((item) => item.path === path);
    
    if (!current) return result;
    
    let parentId = current.parentId;
    while (parentId) {
      const parent = flatMenus.value.find((item) => item.id === parentId);
      if (parent) {
        result.unshift(parent);
        parentId = parent.parentId;
      } else {
        break;
      }
    }
    
    return result;
  };

  return {
    menus,
    loading,
    error,
    visibleMenus,
    flatMenus,
    menuPaths,
    loadMenus,
    findMenuByPath,
    getParentMenus,
  };
});
