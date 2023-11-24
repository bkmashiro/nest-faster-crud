export type DictGetUrl = (context?: any) => string;
export type DictGetData<T> = (context?: any) => Promise<T[]>;
export type LoadDictOpts = {
  reload?: boolean;
  value?: any;
  [key: string]: any;
};
export type Dict<T> = {
  /**
   * dict请求url
   */
  url?: string | DictGetUrl
  /**
   * 自定义获取data远程方法
   */
  // getData?: DictGetData<T>

  /**
   * 字典项value字段名称
   */
  value?: string
  /**
   * 字典项label字段名称
   */
  label?: string
  /**
   * 字典项children字段名称
   */
  children?: string
  /**
   * 字典项color字段名称
   */
  color?: string
  /**
   * 是否是树形
   */
  isTree?: boolean
  /**
   * 是否全局缓存
   */
  cache?: boolean // 获取到结果是否进行全局缓存
  /**
   * 是否将本dict当做原型，所有组件引用后将clone一个实例
   */
  prototype?: boolean // 是否原型配置

  /**
   * 是否分发时复制
   */
  cloneable?: boolean // 是否分发复制
  /**
   * dict创建后是否立即请求
   */
  immediate?: boolean //是否立即请求

  /**
   * 根据values 远程获取字典，prototype=true时有效
   * @param values
   */
  // getNodesByValues?: (values: any, options?: LoadDictOpts) => Promise<T[]>

  /**
   * dict数据远程加载完后触发
   */
  // onReady?: (context: any) => void

  /**
   * 自定义参数
   */
  custom?: any

  /**
   * 本地字典数据，无需远程请求
   */
  data?: T[]
}
