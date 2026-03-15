import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTabStore } from '@/shared/store/tabStore';
import type { TabItem } from '@/shared/types/common.types';

export function useTabs(): void {
  const route = useRoute();
  const router = useRouter();
  const tabStore = useTabStore();

  const addTabFromRoute = (): void => {
    const { path, meta, name } = route;
    const routeName = name as string;

    if (!routeName) {
      return;
    }

    const tab: TabItem = {
      path,
      title: (meta.title as string) || routeName,
      name: routeName,
      closable: path !== '/dashboard',
    };

    tabStore.addTab(tab);
  };

  watch(
    () => route.path,
    () => {
      addTabFromRoute();
    },
    { immediate: true }
  );

  watch(
    () => tabStore.activeTabPath,
    (newPath) => {
      if (newPath !== route.path) {
        router.push(newPath);
      }
    }
  );
}
