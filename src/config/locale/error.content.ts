import { type Dictionary, t } from "intlayer"

export default {
  key: "error",
  content: {
    UNAUTHORIZED: t({ en: "Please login first", zh: "请先登录" }),
    FORBIDDEN: t({ en: "Access denied", zh: "访问被拒绝" }),
    NOT_FOUND: t({ en: "Resource not found", zh: "资源不存在" }),
    VALIDATION_FAILED: t({ en: "Invalid data", zh: "数据无效" }),
    NETWORK_ERROR: t({ en: "Network error, please try again", zh: "网络错误，请重试" }),
    UNKNOWN_ERROR: t({ en: "Something went wrong", zh: "出错了" }),
  },
} satisfies Dictionary
