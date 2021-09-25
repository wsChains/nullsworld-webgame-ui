import { createRouter, createWebHashHistory } from 'vue-router'
import { routes } from './routes'

const newRouter = (emitter) => {
  const router = createRouter({
    history: createWebHashHistory(),
    routes,
    scrollBehavior(to, form, savedPosition) {
      window.scroll({ top: 0, left: 0 })
    }
  })
  router.beforeEach((to, from, next) => {
    emitter.emit('navChange', to?.meta)
    next()
  })
  return router
}

export { newRouter }
