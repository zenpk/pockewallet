import { useState } from "react";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { Memo } from "../localStorage/memo";

export function MemoView() {
  const [text, setText] = useState(Memo.read());
  const [saved, setSaved] = useState(false);

  return (
    <PageLayout>
      <div id="first-lane" className="flex-row-space no-space mb-sm">
        <div className="flex-row-space gap-sm no-space">
          <LeftDrawer />
        </div>
        <h2 className="page-title">Memo</h2>
        <div />
      </div>
      {saved && (
        <div className="alert-success" style={{ marginBlock: "0.5rem" }}>
          Saved!
        </div>
      )}
      <hr />
      <div className="scroll-area" style={{ padding: "0.75rem" }}>
        <textarea
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            width: "100%",
            minHeight: "60vh",
            resize: "vertical",
            fontFamily: "inherit",
            fontSize: "0.95rem",
            lineHeight: 1.6,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
            marginTop: "0.75rem",
          }}
        >
          <button
            type="button"
            className="btn btn-red btn-fixed"
            onClick={() => {
              Memo.clear();
              setText("");
            }}
          >
            Clear
          </button>
          <button
            type="button"
            className="btn btn-blue btn-fixed"
            onClick={() => {
              Memo.write(text);
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
          >
            Save
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
