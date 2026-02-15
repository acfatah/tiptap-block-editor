import type { RouteRecordRaw } from 'vue-router'
// import BlankLayout from '@/layouts/BlankLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    meta: {
      // layout: BlankLayout,
      title: 'Home Page',
    },
    component: () => import('./Home.vue'),
  },
]

export default routes
