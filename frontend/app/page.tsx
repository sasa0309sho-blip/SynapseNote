"use client";

import { useEffect, useMemo, useState } from "react";

type ApiError = {
  code: string;
  message: string;
};

type ApiResponse<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: ApiError;
    };

type Tag = {
  tag_id: number;
  tag_name: string;
};

type Subject = {
  subject_id: number;
  subject_name: string;
};

type MemoSummary = {
  memo_id: number;
  memo_name: string;
};

type MemoDetail = MemoSummary & {
  memo_detail: string;
};

type QA = {
  qa_id: number;
  question: string;
  answer: string;
  subject_id: number;
  memo_id: number;
};

type RepeatSubject = Subject;

type RepeatDetail = Subject & {
  subject_detail: string;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api"
).replace(/\/$/, "");
const DEMO_USER_ID = process.env.NEXT_PUBLIC_DEMO_USER_ID ?? "demo-user";

async function fetchApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const payload = (await response.json()) as ApiResponse<T>;

  if (!payload.ok) {
    throw new Error(`${payload.error.code}: ${payload.error.message}`);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return payload.data;
}

function classNames(...names: Array<string | false | null | undefined>) {
  return names.filter(Boolean).join(" ");
}

function NotebookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="sectionIcon">
      <path d="M7 4.5h10a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z" />
      <path d="M9 4.5v15M11.5 8h4M11.5 11h4" />
    </svg>
  );
}

function QAIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="sectionIcon">
      <path d="M4.5 6.5A2.5 2.5 0 0 1 7 4h10a2.5 2.5 0 0 1 2.5 2.5v6A2.5 2.5 0 0 1 17 15H9l-4.5 4v-12.5Z" />
      <path d="M10 8.25a2.1 2.1 0 1 1 2 2.75v1M12 14.5h.01" />
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="sectionIcon">
      <path d="M17.5 8.5A6.5 6.5 0 0 0 6.1 6.1L4 8.2" />
      <path d="M4 4.5v3.7h3.7M6.5 15.5a6.5 6.5 0 0 0 11.4 2.4L20 15.8" />
      <path d="M20 19.5v-3.7h-3.7" />
    </svg>
  );
}

export default function Home() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [memos, setMemos] = useState<MemoSummary[]>([]);
  const [qaList, setQaList] = useState<QA[]>([]);
  const [repeatSubjects, setRepeatSubjects] = useState<RepeatSubject[]>([]);
  const [memoDetail, setMemoDetail] = useState<MemoDetail | null>(null);
  const [repeatDetail, setRepeatDetail] = useState<RepeatDetail | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedMemoId, setSelectedMemoId] = useState<number | null>(null);
  const [selectedRepeatSubjectId, setSelectedRepeatSubjectId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedTag = useMemo(
    () => tags.find((tag) => tag.tag_id === selectedTagId),
    [selectedTagId, tags]
  );
  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.subject_id === selectedSubjectId),
    [selectedSubjectId, subjects]
  );

  useEffect(() => {
    let isActive = true;

    async function loadInitialData() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [nextTags, nextQaList, nextRepeatSubjects] = await Promise.all([
          fetchApi<Tag[]>(`/${DEMO_USER_ID}/tags`),
          fetchApi<QA[]>(`/${DEMO_USER_ID}/qa`),
          fetchApi<RepeatSubject[]>(`/${DEMO_USER_ID}/repeat`)
        ]);

        if (!isActive) {
          return;
        }

        setTags(nextTags);
        setQaList(nextQaList);
        setRepeatSubjects(nextRepeatSubjects);
        setSelectedTagId(nextTags[0]?.tag_id ?? null);
        setSelectedRepeatSubjectId(nextRepeatSubjects[0]?.subject_id ?? null);
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "API request failed");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadSubjects() {
      if (selectedTagId === null) {
        setSubjects([]);
        setSelectedSubjectId(null);
        return;
      }

      setErrorMessage(null);

      try {
        const nextSubjects = await fetchApi<Subject[]>(
          `/${DEMO_USER_ID}/tags/${selectedTagId}`
        );

        if (!isActive) {
          return;
        }

        setSubjects(nextSubjects);
        setSelectedSubjectId(nextSubjects[0]?.subject_id ?? null);
        setSelectedMemoId(null);
        setMemoDetail(null);
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "API request failed");
        }
      }
    }

    loadSubjects();

    return () => {
      isActive = false;
    };
  }, [selectedTagId]);

  useEffect(() => {
    let isActive = true;

    async function loadMemos() {
      if (selectedTagId === null || selectedSubjectId === null) {
        setMemos([]);
        setSelectedMemoId(null);
        return;
      }

      setErrorMessage(null);

      try {
        const nextMemos = await fetchApi<MemoSummary[]>(
          `/${DEMO_USER_ID}/tags/${selectedTagId}/${selectedSubjectId}`
        );

        if (!isActive) {
          return;
        }

        setMemos(nextMemos);
        setSelectedMemoId(nextMemos[0]?.memo_id ?? null);
        setMemoDetail(null);
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "API request failed");
        }
      }
    }

    loadMemos();

    return () => {
      isActive = false;
    };
  }, [selectedSubjectId, selectedTagId]);

  useEffect(() => {
    let isActive = true;

    async function loadMemoDetail() {
      if (selectedTagId === null || selectedSubjectId === null || selectedMemoId === null) {
        setMemoDetail(null);
        return;
      }

      setErrorMessage(null);

      try {
        const nextMemoDetail = await fetchApi<MemoDetail>(
          `/${DEMO_USER_ID}/tags/${selectedTagId}/${selectedSubjectId}/${selectedMemoId}`
        );

        if (isActive) {
          setMemoDetail(nextMemoDetail);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "API request failed");
        }
      }
    }

    loadMemoDetail();

    return () => {
      isActive = false;
    };
  }, [selectedMemoId, selectedSubjectId, selectedTagId]);

  useEffect(() => {
    let isActive = true;

    async function loadRepeatDetail() {
      if (selectedRepeatSubjectId === null) {
        setRepeatDetail(null);
        return;
      }

      setErrorMessage(null);

      try {
        const nextRepeatDetail = await fetchApi<RepeatDetail>(
          `/${DEMO_USER_ID}/repeat/${selectedRepeatSubjectId}`
        );

        if (isActive) {
          setRepeatDetail(nextRepeatDetail);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "API request failed");
        }
      }
    }

    loadRepeatDetail();

    return () => {
      isActive = false;
    };
  }, [selectedRepeatSubjectId]);

  return (
    <main className="appShell">
      <header className="topBar">
        <div>
          <p className="eyebrow">SynapseNote MVP</p>
          <h1>学習ノートを、復習と一問一答につなげる</h1>
        </div>
        <div className="apiStatus">
          <span className={classNames("statusDot", errorMessage ? "statusDotError" : null)} />
          {errorMessage ? "API error" : isLoading ? "Loading" : "API connected"}
        </div>
      </header>

      {errorMessage ? <p className="errorBanner">{errorMessage}</p> : null}

      <section className="dashboardGrid" aria-label="SynapseNote dashboard">
        <div className="notesPanel">
          <div className="sectionTitle">
            <NotebookIcon />
            <div>
              <p>Notebook</p>
              <h2>ノート一覧</h2>
            </div>
          </div>

          <div className="threeColumn">
            <div className="column">
              <h3>Tags</h3>
              <div className="stack">
                {tags.map((tag) => (
                  <button
                    key={tag.tag_id}
                    className={classNames(
                      "selectItem",
                      selectedTagId === tag.tag_id && "selectItemActive"
                    )}
                    type="button"
                    onClick={() => setSelectedTagId(tag.tag_id)}
                  >
                    {tag.tag_name}
                  </button>
                ))}
              </div>
            </div>

            <div className="column">
              <h3>Subjects</h3>
              <div className="stack">
                {subjects.map((subject) => (
                  <button
                    key={subject.subject_id}
                    className={classNames(
                      "selectItem",
                      selectedSubjectId === subject.subject_id && "selectItemActive"
                    )}
                    type="button"
                    onClick={() => setSelectedSubjectId(subject.subject_id)}
                  >
                    {subject.subject_name}
                  </button>
                ))}
              </div>
            </div>

            <div className="column">
              <h3>Memos</h3>
              <div className="stack">
                {memos.map((memo) => (
                  <button
                    key={memo.memo_id}
                    className={classNames(
                      "selectItem",
                      selectedMemoId === memo.memo_id && "selectItemActive"
                    )}
                    type="button"
                    onClick={() => setSelectedMemoId(memo.memo_id)}
                  >
                    {memo.memo_name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <article className="memoDetail">
            <div>
              <p className="muted">
                {selectedTag?.tag_name ?? "Tag"} / {selectedSubject?.subject_name ?? "Subject"}
              </p>
              <h2>{memoDetail?.memo_name ?? "メモを選択"}</h2>
            </div>
            <p>{memoDetail?.memo_detail ?? "左のリストからメモを選んでください。"}</p>
          </article>
        </div>

        <div className="sidePanel">
          <div className="sectionTitle">
            <QAIcon />
            <div>
              <p>Question Answer</p>
              <h2>一問一答</h2>
            </div>
          </div>

          <div className="qaList">
            {qaList.map((qa) => (
              <article className="qaCard" key={qa.qa_id}>
                <p className="question">{qa.question}</p>
                <p className="answer">{qa.answer}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="sidePanel">
          <div className="sectionTitle">
            <RepeatIcon />
            <div>
              <p>Recall Check</p>
              <h2>覚えているか？</h2>
            </div>
          </div>

          <div className="repeatLayout">
            <div className="stack">
              {repeatSubjects.map((subject) => (
                <button
                  key={subject.subject_id}
                  className={classNames(
                    "selectItem",
                    selectedRepeatSubjectId === subject.subject_id && "selectItemActive"
                  )}
                  type="button"
                  onClick={() => setSelectedRepeatSubjectId(subject.subject_id)}
                >
                  {subject.subject_name}
                </button>
              ))}
            </div>

            <article className="repeatDetail">
              <h3>{repeatDetail?.subject_name ?? "復習対象"}</h3>
              <p>{repeatDetail?.subject_detail ?? "復習テーマを選んでください。"}</p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
