import type { EmailParseKind, Stage } from "@/lib/types";

export interface ParseEmailResult {
  kind: EmailParseKind;
  suggestedStage: Stage;
  companyGuess: string | null;
  confidence: "low" | "medium";
  evidence: string;
}

function extractCompany(subject: string, body: string): string | null {
  const bracket = subject.match(/^【([^】]{1,24})】/);
  if (bracket?.[1]) return bracket[1].trim();

  const corp = body.match(
    /([\u4e00-\u9fa5]{2,12}(?:科技|集团|有限公司|股份有限公司|网络|信息|软件|智能))/,
  );
  if (corp?.[1]) return corp[1].trim();

  const dear = body.match(
    /(?:尊敬的|亲爱的)\s*([\u4e00-\u9fa5]{2,12})(?:同学|您好|，)/,
  );
  if (dear?.[1] && dear[1].length >= 2) return `${dear[1].trim()}（推测）`;

  return null;
}

function scoreCompany(guess: string | null): "low" | "medium" {
  if (!guess) return "low";
  if (guess.includes("推测")) return "low";
  if (guess.length >= 4) return "medium";
  return "low";
}

/**
 * 基于中文招聘邮件常见关键词的规则解析（可替换为模型或更复杂规则）。
 */
export function parseEmail(input: {
  subject: string;
  bodyText: string;
}): ParseEmailResult {
  const subject = input.subject.trim();
  const body = input.bodyText.trim();
  const text = `${subject}\n${body}`;
  const companyGuess = extractCompany(subject, body);

  if (
    /录用通知|恭喜您.*录用|发放\s*offer|Offer\s*Letter|拟录用|恭喜获得.*offer/i.test(
      text,
    )
  ) {
    return {
      kind: "offer_letter",
      suggestedStage: "offer",
      companyGuess,
      confidence: scoreCompany(companyGuess),
      evidence: "匹配关键词：录用 / Offer",
    };
  }

  if (
    /面试邀请|邀请您参加面试|视频面试|线下面试|复试|二面|三面|腾讯会议|飞书会议|Zoom|面试链接/.test(
      text,
    )
  ) {
    return {
      kind: "interview_invite",
      suggestedStage: "interview",
      companyGuess,
      confidence: scoreCompany(companyGuess),
      evidence: "匹配关键词：面试邀请 / 会议链接",
    };
  }

  if (/笔试|在线测评|测评链接|牛客|赛码|能力测试|OJ|编程测试/.test(text)) {
    return {
      kind: "written_test",
      suggestedStage: "written",
      companyGuess,
      confidence: scoreCompany(companyGuess),
      evidence: "匹配关键词：笔试 / 测评",
    };
  }

  if (
    /很遗憾|未能通过|未通过筛选|不予录取|不合适|不匹配|感谢您对.*的关注.*但/.test(
      text,
    )
  ) {
    return {
      kind: "rejection",
      suggestedStage: "rejected",
      companyGuess,
      confidence: scoreCompany(companyGuess),
      evidence: "匹配关键词：未通过 / 遗憾 / 不合适",
    };
  }

  if (/简历(?:已)?收到|已收到您的申请|申请已提交|感谢您的投递/.test(text)) {
    return {
      kind: "ack",
      suggestedStage: "applied",
      companyGuess,
      confidence: scoreCompany(companyGuess),
      evidence: "匹配关键词：已收到简历 / 感谢投递",
    };
  }

  return {
    kind: "unknown",
    suggestedStage: "applied",
    companyGuess,
    confidence: "low",
    evidence: "未匹配到明确规则，请人工确认",
  };
}
