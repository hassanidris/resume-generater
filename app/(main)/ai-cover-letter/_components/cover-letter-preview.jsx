"use client";

import { useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Edit, Monitor, Download, Save } from "lucide-react";
import { updateCoverLetter } from "@/actions/cover-letter";

const CoverLetterPreview = ({ content: initialContent, letterId }) => {
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState("preview");
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateCoverLetter(letterId, content);
      toast.success("Cover letter saved!");
    } catch (error) {
      toast.error("Failed to save cover letter.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const html2pdf = (await import("html2pdf.js")).default;
      const element = document.getElementById("cover-letter-pdf");
      const opt = {
        margin: [10, 10],
        filename: "cover-letter.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };
      html2pdf().set(opt).from(element).save();
    } catch (error) {
      toast.error("Failed to generate PDF.");
      console.error(error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Cover Letter"}
        </Button>

        <Button
          onClick={handleDownload}
          variant="outline"
          disabled={downloading}
        >
          <Download className="h-4 w-4 mr-2" />
          {downloading ? "Downloading..." : "Download PDF"}
        </Button>

        <Button
          variant="ghost"
          type="button"
          onClick={() => setMode(mode === "preview" ? "edit" : "preview")}
        >
          {mode === "preview" ? (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Edit Markdown
            </>
          ) : (
            <>
              <Monitor className="h-4 w-4 mr-2" />
              Preview
            </>
          )}
        </Button>
      </div>

      <div className="border rounded-lg">
        <MDEditor
          value={content}
          onChange={setContent}
          preview={mode}
          height={700}
        />
      </div>

      <div className="hidden">
        <div id="cover-letter-pdf" className="p-6 bg-white text-black">
          <MDEditor.Markdown
            source={content}
            style={{
              background: "white",
              color: "black",
              fontFamily: "Arial, sans-serif",
              lineHeight: 1.6,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CoverLetterPreview;
