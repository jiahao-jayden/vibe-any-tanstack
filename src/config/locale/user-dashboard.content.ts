import { type Dictionary, t } from "intlayer"

export default {
  key: "user-dashboard",
  content: {
    menu: {
      settings: t({ en: "Settings", zh: "设置" }),
      account: t({ en: "Account", zh: "账户" }),
      usage: t({ en: "Usage", zh: "使用情况" }),
    },
    credits: {
      upgrade: t({ en: "Upgrade", zh: "升级" }),
      totalCredits: t({ en: "Total Credits", zh: "总积分" }),
      purchasedCredits: t({
        en: "Purchased/Granted Credits (excl. daily bonus)",
        zh: "购买积分/赠送积分（不包含每日赠送）",
      }),
      dailyBonus: t({ en: "Daily Bonus Credits", zh: "每日赠送积分" }),
      dailyRefreshAt: t({
        en: "Next refresh: {time}",
        zh: "下次刷新：{time}",
      }),
      dailyAmount: t({
        en: "{amount} credits every 24 hours",
        zh: "每 24 小时赠送 {amount} 积分",
      }),
    },
    history: {
      title: t({ en: "Usage", zh: "使用情况" }),
      description: t({
        en: "View your credit transaction history",
        zh: "查看您的积分变动历史",
      }),
      empty: t({ en: "No credit records", zh: "暂无积分记录" }),
      time: t({ en: "Time", zh: "时间" }),
      type: t({ en: "Type", zh: "类型" }),
      change: t({ en: "Change", zh: "积分变动" }),
      totalRecords: t({ en: "{count} records", zh: "共 {count} 条记录" }),
    },
    creditTypes: {
      add_first_registration: t({ en: "Registration Bonus", zh: "注册赠送" }),
      add_subscription_payment: t({ en: "Subscription", zh: "订阅购买" }),
      add_one_time_payment: t({ en: "Purchase", zh: "充值购买" }),
      add_daily_bonus: t({ en: "Daily Bonus", zh: "每日赠送" }),
      add_admin: t({ en: "Admin Grant", zh: "管理员赠送" }),
      add_refund: t({ en: "Refund", zh: "退款返还" }),
      deduct_ai_use: t({ en: "AI Usage", zh: "AI 使用" }),
      ai_text: t({ en: "AI Text", zh: "AI 文本" }),
      ai_image: t({ en: "AI Image", zh: "AI 图片" }),
      ai_speech: t({ en: "AI Speech", zh: "AI 语音" }),
      ai_video: t({ en: "AI Video", zh: "AI 视频" }),
      deduct_expired: t({ en: "Expired", zh: "积分过期" }),
    },
  },
} satisfies Dictionary
