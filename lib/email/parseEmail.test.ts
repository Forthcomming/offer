import { describe, expect, it } from "vitest";
import { parseEmail } from "./parseEmail";

describe("parseEmail", () => {
  it("detects interview invite", () => {
    const r = parseEmail({
      subject: "【星尘科技】面试邀请",
      bodyText:
        "您好，邀请您参加视频面试，请使用腾讯会议进入会议室。期待与您交流。",
    });
    expect(r.kind).toBe("interview_invite");
    expect(r.suggestedStage).toBe("interview");
    expect(r.companyGuess).toBe("星尘科技");
  });

  it("detects rejection", () => {
    const r = parseEmail({
      subject: "应聘反馈",
      bodyText:
        "非常感谢您的投递，很遗憾您未能通过本次筛选，祝您早日找到合适的机会。",
    });
    expect(r.kind).toBe("rejection");
    expect(r.suggestedStage).toBe("rejected");
  });

  it("detects written test", () => {
    const r = parseEmail({
      subject: "笔试通知",
      bodyText: "请在本周内完成在线测评，链接如下。",
    });
    expect(r.kind).toBe("written_test");
    expect(r.suggestedStage).toBe("written");
  });

  it("returns unknown for generic text", () => {
    const r = parseEmail({
      subject: "无意义主题",
      bodyText: "这是一封普通邮件，没有招聘关键词。",
    });
    expect(r.kind).toBe("unknown");
  });
});
