import BaseMixin from '../../_util/BaseMixin'
import PropTypes from '../../_util/vue-types'
import KeyCode from './KeyCode'
import { getOptionProps } from '../../_util/props-util'
import { cloneElement } from '../../_util/vnode'

function getDefaultActiveKey (props) {
  let activeKey
  const children = props.children
  children.forEach((child) => {
    if (child && !activeKey && !child.disabled) {
      activeKey = child.key
    }
  })
  return activeKey
}

function activeKeyIsValid (props, key) {
  const children = props.children
  const keys = children.map(child => child && child.key)
  return keys.indexOf(key) >= 0
}

export default {
  name: 'Tabs',
  model: {
    prop: 'activeKey',
    event: 'change',
  },
  mixins: [BaseMixin],
  props: {
    destroyInactiveTabPane: PropTypes.bool,
    renderTabBar: PropTypes.func.isRequired,
    renderTabContent: PropTypes.func.isRequired,
    navWrapper: PropTypes.func.def(arg => arg),
    children: PropTypes.any.def([]),
    prefixCls: PropTypes.string.def('ant-tabs'),
    tabBarPosition: PropTypes.string.def('top'),
    activeKey: PropTypes.string,
    defaultActiveKey: PropTypes.string,
    __propsSymbol__: PropTypes.any,
  },
  data () {
    const props = getOptionProps(this)
    let activeKey
    if ('activeKey' in props) {
      activeKey = props.activeKey
    } else if ('defaultActiveKey' in props) {
      activeKey = props.defaultActiveKey
    } else {
      activeKey = getDefaultActiveKey(props)
    }
    return {
      _activeKey: activeKey,
    }
  },
  watch: {
    __propsSymbol__ () {
      const nextProps = getOptionProps(this)
      if ('activeKey' in nextProps) {
        this.setState({
          _activeKey: nextProps.activeKey,
        })
      } else if (!activeKeyIsValid(nextProps, this.$data._activeKey)) {
        // https://github.com/ant-design/ant-design/issues/7093
        this.setState({
          _activeKey: getDefaultActiveKey(nextProps),
        })
      }
    },
  },
  methods: {
    onTabClick (activeKey, e) {
      if (this.tabBar.componentOptions &&
        this.tabBar.componentOptions.listeners &&
        this.tabBar.componentOptions.listeners.tabClick) {
        this.tabBar.componentOptions.listeners.tabClick(activeKey, e)
      }
      this.setActiveKey(activeKey)
    },

    onNavKeyDown (e) {
      const eventKeyCode = e.keyCode
      if (eventKeyCode === KeyCode.RIGHT || eventKeyCode === KeyCode.DOWN) {
        e.preventDefault()
        const nextKey = this.getNextActiveKey(true)
        this.onTabClick(nextKey)
      } else if (eventKeyCode === KeyCode.LEFT || eventKeyCode === KeyCode.UP) {
        e.preventDefault()
        const previousKey = this.getNextActiveKey(false)
        this.onTabClick(previousKey)
      }
    },

    setActiveKey (activeKey) {
      if (this.$data._activeKey !== activeKey) {
        const props = getOptionProps(this)
        if (!('activeKey' in props)) {
          this.setState({
            _activeKey: activeKey,
          })
        }
        this.__emit('change', activeKey)
      }
    },

    getNextActiveKey (next) {
      const activeKey = this.$data._activeKey
      const children = []
      this.$props.children.forEach((c) => {
        if (c && !c.disabled && c.disabled !== '') {
          if (next) {
            children.push(c)
          } else {
            children.unshift(c)
          }
        }
      })
      const length = children.length
      let ret = length && children[0].key
      children.forEach((child, i) => {
        if (child.key === activeKey) {
          if (i === length - 1) {
            ret = children[0].key
          } else {
            ret = children[i + 1].key
          }
        }
      })
      return ret
    },
  },
  render () {
    const props = this.$props
    const {
      prefixCls,
      navWrapper,
      tabBarPosition,
      renderTabContent,
      renderTabBar,
      destroyInactiveTabPane,
    } = props
    const cls = {
      [prefixCls]: 1,
      [`${prefixCls}-${tabBarPosition}`]: 1,
    }

    this.tabBar = renderTabBar()
    const contents = [
      cloneElement(this.tabBar, {
        props: {
          prefixCls,
          navWrapper,
          tabBarPosition,
          panels: props.children,
          activeKey: this.$data._activeKey,
        },
        on: {
          keydown: this.onNavKeyDown,
          tabClick: this.onTabClick,
        },
        key: 'tabBar',
      }),
      cloneElement(renderTabContent(), {
        props: {
          prefixCls,
          tabBarPosition,
          activeKey: this.$data._activeKey,
          destroyInactiveTabPane,
        },
        on: {
          change: this.setActiveKey,
        },
        children: props.children,
        key: 'tabContent',
      }),
    ]
    if (tabBarPosition === 'bottom') {
      contents.reverse()
    }
    return (
      <div
        class={cls}
      >
        {contents}
      </div>
    )
  },
}
