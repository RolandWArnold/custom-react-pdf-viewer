import { useEffect, useState } from "react";
import { CustomPdfViewer } from "custom-react-pdf-viewer";
import "./App.css";

// Updated Document List
const DOCUMENTS = [
  { id: 1, title: "Attention Is All You Need", fileName: "1-NIPS-2017-attention-is-all-you-need.pdf" },
  { id: 2, title: "To Build a Fire (Jack London)", fileName: "2-To-Build-a-Fire-by-Jack-London.pdf" },
  { id: 3, title: "Mutual Disclosure Agreement", fileName: "3-Template-CDA-Mutual-Disclosure.pdf" },
  { id: 4, title: "Business Proposal Template", fileName: "4-Business-proposal-template.pdf" },
  { id: 5, title: "Lorem Ipsum Test", fileName: "5-Lorem-ipsum.pdf" },
];

export default function App() {
  const [selectedDocId, setSelectedDocId] = useState<number>(DOCUMENTS[0].id);
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeDoc = DOCUMENTS.find((d) => d.id === selectedDocId) || DOCUMENTS[0];

  useEffect(() => {
    let isMounted = true;

    const fetchDocument = async () => {
      setError(null);
      setFileBlob(null);

      try {
        // Fetch the file from the public folder
        const res = await fetch(`/${activeDoc.fileName}`);

        if (!res.ok) {
          throw new Error(`Could not load ${activeDoc.fileName}`);
        }

        const blob = await res.blob();

        if (isMounted) {
          setFileBlob(blob);
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setError("Failed to load document. Please check if the file exists in /public.");
        }
      }
    };

    fetchDocument();

    return () => {
      isMounted = false;
    };
  }, [activeDoc]);

  return (
    <div className="app-shell">
      {/* Sidebar Area (20%) */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Documents</h2>
        </div>
        <nav className="doc-list">
          {DOCUMENTS.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDocId(doc.id)}
              className={`doc-item ${selectedDocId === doc.id ? "active" : ""}`}
            >
              <span className="doc-icon">📄</span>
              <span className="doc-title">{doc.title}</span>
              <span className="doc-filename">{doc.fileName}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content / Viewer Area (80%) */}
      <main className="main-content">
        {error && (
          <div className="status-message error">
            <p>⚠️ {error}</p>
          </div>
        )}

        {!error && fileBlob && (
          <div className="viewer-wrapper">
            <CustomPdfViewer
              fileName={activeDoc.fileName}
              file={fileBlob}
            />
          </div>
        )}
      </main>
    </div>
  );
}