import View from './components/view'
import Link from './components/link'

export let _Vue

export function install (Vue) {

  // 避免重复加载插件
  if (install.installed && _Vue === Vue) return
  install.installed = true

  // 缓存项目中的Vue，实际上跟 webpack 的 externals 机制差不多，都是为了不需要单独引用 Vue 减少包的大小
  _Vue = Vue

  const isDef = v => v !== undefined

  const registerInstance = (vm, callVal) => {
    let i = vm.$options._parentVnode
    if (isDef(i) && isDef(i = i.data) && isDef(i = i.registerRouteInstance)) {
      i(vm, callVal)
    }
  }

  // 在两个钩子中混入各种属性
  Vue.mixin({
    beforeCreate () {

      // 在 new Vue 的时候会将参数合并到 $options 中
      if (isDef(this.$options.router)) {
        this._routerRoot = this
        this._router = this.$options.router

        // 调用路由器的init方法
        this._router.init(this)

        // 将 _route 变成一个响应式对象
        Vue.util.defineReactive(this, '_route', this._router.history.current)
      } else {
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this
      }
      registerInstance(this, this)
    },
    destroyed () {
      registerInstance(this)
    }
  })

  // 能够访问 $route 和 $router 的原因
  Object.defineProperty(Vue.prototype, '$router', {
    get () { return this._routerRoot._router }
  })

  Object.defineProperty(Vue.prototype, '$route', {
    get () { return this._routerRoot._route }
  })

  // 注册 router-view 和 router-link 组件
  Vue.component('RouterView', View)
  Vue.component('RouterLink', Link)

  const strats = Vue.config.optionMergeStrategies
  // use the same hook merging strategy for route hooks
  strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created
}
