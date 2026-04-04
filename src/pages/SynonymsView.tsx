import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useId,
  useState,
} from "react";
import { BiMenu, BiPlus, BiX } from "react-icons/bi";
import { Dialog } from "../components/Dialog";
import { Dropdown, DropdownItem } from "../components/Dropdown";
import { LeftDrawer } from "../components/LeftDrawer";
import { PageLayout } from "../components/PageLayout";
import { useDisclosure } from "../hooks/useDisclosure";
import { Synonyms } from "../localStorage/synonyms";
import { getUuid } from "../utils/utils";

export function SynonymsView() {
  const [groups, setGroups] = useState<Synonyms.SynonymGroup[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    setGroups(Synonyms.readAll());
  }, []);

  return (
    <PageLayout>
      <div id="first-lane" className="flex-row-space no-space mb-sm">
        <div className="flex-row-space gap-sm no-space">
          <LeftDrawer />
          <button type="button" className="btn btn-green" onClick={onOpen}>
            <BiPlus />
            Add
          </button>
          {isOpen && (
            <SynonymForm
              setGroups={setGroups}
              isOpen={isOpen}
              onOpen={onOpen}
              onClose={onClose}
            />
          )}
        </div>
        <h2 className="page-title">Synonyms</h2>
        <div />
      </div>
      <hr />
      <SynonymTable groups={groups} setGroups={setGroups} />
    </PageLayout>
  );
}

function SynonymForm({
  setGroups,
  isOpen,
  onOpen,
  onClose,
  idValue,
}: {
  setGroups: Dispatch<SetStateAction<Synonyms.SynonymGroup[]>>;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  idValue?: string;
}) {
  const [words, setWords] = useState<string[]>([""]);
  const [error, setError] = useState<string>("");
  const idPrefix = useId();
  const wordsInputId = `${idPrefix}-word-0`;

  useEffect(() => {
    if (idValue) {
      const result = Synonyms.readById(idValue);
      if (result) {
        setWords(result.words.length > 0 ? result.words : [""]);
      }
    }
  }, [idValue]);

  function addWord() {
    setWords([...words, ""]);
  }

  function updateWord(index: number, value: string) {
    const updated = [...words];
    updated[index] = value;
    setWords(updated);
  }

  function removeWord(index: number) {
    if (words.length <= 1) return;
    setWords(words.filter((_, i) => i !== index));
  }

  return (
    <Dialog
      submit={() => {
        const trimmed = words.map((w) => w.trim()).filter((w) => w.length > 0);
        if (trimmed.length < 2) {
          setError("Add at least 2 words to form a synonym group.");
          return false;
        }
        const unique = [...new Set(trimmed.map((w) => w.toLowerCase()))];
        if (unique.length !== trimmed.length) {
          setError("Duplicate words are not allowed.");
          return false;
        }
        Synonyms.write({
          id: idValue || getUuid(),
          words: trimmed,
        });
        setGroups(Synonyms.readAll());
        return true;
      }}
      title={idValue ? "Edit Synonym Group" : "Add Synonym Group"}
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
    >
      <div className="form-group">
        <label htmlFor={wordsInputId}>Words (at least 2)</label>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}
        >
          {words.map((word, index) => (
            <div
              key={`word-${index.toString()}`}
              style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}
            >
              <input
                id={index === 0 ? wordsInputId : undefined}
                className="input"
                type="text"
                value={word}
                placeholder={`Word ${index + 1}`}
                onChange={(e) => updateWord(index, e.target.value)}
                style={{ flex: 1 }}
              />
              {words.length > 1 && (
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => removeWord(index)}
                  aria-label="Remove word"
                >
                  <BiX />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-sm"
          onClick={addWord}
          style={{ marginTop: "0.4rem" }}
        >
          <BiPlus /> Add word
        </button>
        {error && <span className="form-error">{error}</span>}
      </div>
    </Dialog>
  );
}

function SynonymTable({
  groups,
  setGroups,
}: {
  groups: Synonyms.SynonymGroup[];
  setGroups: Dispatch<SetStateAction<Synonyms.SynonymGroup[]>>;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentId, setCurrentId] = useState<string>("");

  return (
    <>
      {isOpen && (
        <SynonymForm
          setGroups={setGroups}
          isOpen={isOpen}
          onOpen={onOpen}
          onClose={onClose}
          idValue={currentId}
        />
      )}
      <div className="scroll-area">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Words</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {groups.map((group, index) => (
              <tr key={group.id}>
                <td>{index + 1}</td>
                <td>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}
                  >
                    {group.words.map((word) => (
                      <span key={word} className="badge badge-outline">
                        {word}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <Dropdown
                    trigger={
                      <button
                        type="button"
                        className="btn-icon"
                        aria-label="Options"
                      >
                        <BiMenu />
                      </button>
                    }
                  >
                    <DropdownItem
                      onClick={() => {
                        setCurrentId(group.id);
                        onOpen();
                      }}
                    >
                      Edit
                    </DropdownItem>
                    <DropdownItem
                      style={{ color: "#ee0000" }}
                      onClick={() => {
                        Synonyms.remove(group.id);
                        setGroups(Synonyms.readAll());
                      }}
                    >
                      Delete
                    </DropdownItem>
                  </Dropdown>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
