import { type Dictionary, t } from "intlayer"

export default {
  key: "credit-packages",
  content: {
    credit_100: {
      name: t({ en: "100 Credits", zh: "100 积分" }),
      description: t({ en: "Perfect for temporary testing", zh: "适合临时测试" }),
    },
  },
} satisfies Dictionary
