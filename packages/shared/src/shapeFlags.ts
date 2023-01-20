export const enum ShapeFlags {
  ELEMENT = 1,
  // 函数式组件
  FUNCTIONAL_COMPONENT = 1 << 1,
  // 状态组件
  STATEFUL_COMPONENT = 1 << 2,
  // 文本节点
  TEXT_CHILDREN = 1 << 3,
  // 数组节点
  ARRAY_CHILDREN = 1 << 4,
  // 具名插槽
  SLOTS_CHILDREN = 1 << 5,
  // 传送门
  TELEPORT = 1 << 6,
  // 异步组件
  SUSPENSE = 1 << 7,
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  // 组件保持活跃
  COMPONENT_KEPT_ALIVE = 1 << 9,
  // 组件
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT
}
