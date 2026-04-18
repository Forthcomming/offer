export type AiQuickAction = "jd_resume" | "email" | "interview";

const NOTICE = "【提示】AI 尚未接入真实模型，以下为占位模版。\n\n";

export function stubReply(action: AiQuickAction, userText: string): string {
  const t = userText.trim();
  const ctx = t ? `你提供的内容摘要：${t.slice(0, 200)}${t.length > 200 ? "…" : ""}\n\n` : "";

  switch (action) {
    case "jd_resume":
      return (
        `${NOTICE}${ctx}` +
        "建议动作：\n" +
        "1) 用 JD 关键词对齐简历小标题（技能/项目/成果）\n" +
        "2) 每个项目补 1 条可量化指标（时延/吞吐/转化率等）\n" +
        "3) 删除与岗位无关的长段落，控制在一页内\n"
      );
    case "email":
      return (
        `${NOTICE}${ctx}` +
        "邮件草稿（可粘贴后改称呼与公司）：\n\n" +
        "尊敬的招聘负责人：\n" +
        "您好！我是XXX，投递贵司「XXX岗位」。想跟进一下简历筛选进度，如有需要我可补充材料或作品集链接。\n" +
        "感谢抽空阅读，祝工作顺利！\n" +
        "此致\n" +
        "敬礼\n" +
        "XXX\n"
      );
    case "interview":
      return (
        `${NOTICE}${ctx}` +
        "模拟面试（占位问答）：\n\n" +
        "Q1：请用 2 分钟介绍一个你最有代表性的项目。\n" +
        "Q2：你在项目里遇到的最大技术难点是什么？如何验证方案有效？\n" +
        "Q3：如果需求变更导致排期风险，你会怎么沟通与拆解？\n"
      );
    default:
      return `${NOTICE}未知操作类型。`;
  }
}

export function stubReplyFreeform(userText: string): string {
  const t = userText.trim();
  if (!t) return `${NOTICE}请输入你想问的问题，或点击上方快捷入口。`;
  return (
    `${NOTICE}` +
    `已收到你的问题：「${t.slice(0, 120)}${t.length > 120 ? "…" : ""}」\n\n` +
    "接入模型后，这里会基于你的申请数据、简历版本与 JD 文本生成更具体的回答。"
  );
}
