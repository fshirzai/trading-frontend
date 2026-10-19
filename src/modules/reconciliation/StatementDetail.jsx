"use client";
import { Localized } from "../../shared/i18n.jsx";
import { useEffect, useState } from "react";
import { Button, ErrorBox, Modal } from "../../shared/ui.jsx";
import DataTable from "../../shared/DataTable.jsx";
export default function StatementDetail({
  api,
  id,
  onClose,
  onCommand,
  refresh,
}) {
  const [data, setData] = useState(null),
    [cursor, setCursor] = useState(""),
    [error, setError] = useState(null);
  useEffect(() => {
    let live = true;
    setError(null);
    api
      .request(
        `/reconciliation/statements/${id}?limit=25` +
          (cursor ? "&cursor=" + cursor : ""),
      )
      .then((r) => {
        if (live) setData(r);
      })
      .catch((e) => {
        if (live) setError(e);
      });
    return () => {
      live = false;
    };
  }, [api, id, cursor, refresh]);
  return (
    <Localized>
      <Modal
        title={data?.statement?.name || "Bank statement"}
        onClose={onClose}
      >
        <div className="form-body">
          <ErrorBox error={error} />
          {data && (
            <>
              <DataTable
                items={data.items}
                columns={["date", "reference", "amountCents", "journal"]}
                rowActions={[
                  {
                    title: "Match journal",
                    path: "/reconciliation/lines/{id}/match",
                    method: "POST",
                  },
                ]}
                onAction={(a, r) => onCommand({ ...a, id: r._id })}
              />
              <div className="pagination">
                <Button
                  className="secondary"
                  disabled={!cursor}
                  onClick={() => setCursor("")}
                >
                  First page
                </Button>
                <Button
                  className="secondary"
                  disabled={!data.nextCursor}
                  onClick={() => setCursor(data.nextCursor)}
                >
                  Next page
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </Localized>
  );
}
