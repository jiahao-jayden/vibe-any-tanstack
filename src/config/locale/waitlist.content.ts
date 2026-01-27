import { type Dictionary, t } from "intlayer"

export default {
  key: "waitlist",
  content: {
    title: t({
      en: "Join the Waitlist",
      zh: "加入等待列表",
    }),
    description: t({
      en: "Get notified on launch day with an exclusive early bird discount code.",
      zh: "上线当天我们将发送专属早鸟优惠码给您。",
    }),
    emailPlaceholder: t({
      en: "Enter your email",
      zh: "输入您的邮箱",
    }),
    joinButton: t({
      en: "Join",
      zh: "加入",
    }),
    invalidEmail: t({
      en: "Please enter a valid email address",
      zh: "请输入有效的邮箱地址",
    }),
    success: {
      title: t({
        en: "You're on the list!",
        zh: "您已加入等待列表！",
      }),
      description: t({
        en: "We'll send you the early bird discount code on launch day.",
        zh: "上线当天我们会发送早鸟优惠码给您。",
      }),
    },
    earlyBird: {
      title: t({
        en: "Early Bird Offer",
        zh: "早鸟优惠",
      }),
      save: t({
        en: "Save $20",
        zh: "立省 $20",
      }),
      endsIn: t({
        en: "Ends in",
        zh: "剩余时间",
      }),
    },
    footer: t({
      en: "No spam, ever. Unsubscribe anytime.",
      zh: "绝不发送垃圾邮件，随时可退订。",
    }),
  },
} satisfies Dictionary
