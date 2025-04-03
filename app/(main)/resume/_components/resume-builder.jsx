"use client";

import { saveResume } from "@/actions/resume";
import { resumeSchema } from "@/app/lib/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import useFetch from "@/hooks/use-fetch";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Download,
  Edit,
  Loader2,
  Monitor,
  Save,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import EntryForm from "./entry-form";
import { entriesToMarkdown } from "@/app/lib/helper";
import MDEditor from "@uiw/react-md-editor";
import { useUser } from "@clerk/nextjs";
// import html2pdf from "html2pdf.js/dist/html2pdf.min.js";
import { toast } from "sonner";

const ResumeBuilder = ({ initialContent }) => {
  const [activeTab, setActiveTab] = useState("edit");
  const [resumeMode, setResumeMode] = useState("preview");
  const [previewContent, setPreviewContent] = useState(initialContent);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useUser();

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      contactInfo: {},
      summary: "",
      skills: "",
      languages: "",
      experience: [],
      education: [],
      projects: [],
    },
  });

  const {
    loading: isSaving,
    fn: saveResumeFn,
    data: saveResult,
    error: saveError,
  } = useFetch(saveResume);

  const formValues = watch();

  useEffect(() => {
    if (initialContent) setActiveTab("preview");
  }, [initialContent]);

  // useEffect(() => {
  //   if (activeTab === "edit") {
  //     const newContent = getCombinedContent();
  //     setPreviewContent(newContent ? newContent : initialContent);
  //   }
  // }, [formValues, activeTab]);

  useEffect(() => {
    const newContent = getCombinedContent();
    setPreviewContent(newContent);
  }, [formValues]);

  const getContactMarkdown = () => {
    const { contactInfo } = formValues;
    const parts = [];
    // if (contactInfo.profession) parts.push(`${contactInfo.profession}`);
    if (contactInfo.email) parts.push(`📧 ${contactInfo.email}`);
    if (contactInfo.mobile) parts.push(`📱 ${contactInfo.mobile}`);
    if (contactInfo.linkedin)
      parts.push(`💼 [LinkedIn](${contactInfo.linkedin})`);
    if (contactInfo.github) parts.push(`💼 [Github](${contactInfo.github})`);
    if (contactInfo.portfolio)
      parts.push(`💼 [Portfolio](${contactInfo.portfolio})`);

    if (!user) return "";

    // return [
    //   `# ${user.fullName}\n`,
    //   contactInfo.profession ? `### ${contactInfo.profession}` : "",
    //   parts.length > 0 ? parts.join(" | ") : "",
    // ];

    return parts.length > 0
      ? `# ${user.fullName}\n ### ${contactInfo.profession}\n\n${parts.join(
          " | "
        )}`
      : "";
  };

  const getCombinedContent = () => {
    const { summary, skills, languages, experience, education, projects } =
      formValues;

    return [
      `<div class="avoid-page-break">`,
      getContactMarkdown(),
      `</div>`,
      `<div class="avoid-page-break">`,
      summary && `## Professional Summary\n\n${summary}`,
      `</div>`,
      `<div class="avoid-page-break">`,
      skills && `## Skills\n\n${skills}`,
      `</div>`,
      `<div class="avoid-page-break">`,
      entriesToMarkdown(experience, "Work Experience"),
      `</div>`,
      `<div class="avoid-page-break">`,
      entriesToMarkdown(education, "Education"),
      `</div>`,
      `<div class="avoid-page-break">`,
      entriesToMarkdown(projects, "Projects"),
      `</div>`,
      `<div class="avoid-page-break">`,
      languages && `## Languages Spoken\n\n${languages}`,
      `</div>`,
    ]
      .filter(Boolean)
      .join("\n\n");
  };

  useEffect(() => {
    if (saveResult && !isSaving) {
      toast.success("Resume saved successfully!");
    }
    if (saveError) {
      toast.error(saveError.message || "Failed to save resume");
    }
  }, [saveResult, saveError, isSaving]);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      if (typeof window === "undefined") {
        toast.error(
          "PDF generating is only available in the browser environment"
        );
        return;
      }

      const html2pdf = (await import("html2pdf.js")).default;
      const element = document.getElementById("resume-pdf");
      const opt = {
        margin: [15, 15],
        filename: `${user.fullName} - resume.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
          compress: true,
          putOnlyUsedFonts: true,
        },
        pagebreak: {
          mode: ["avoid"],
        },
      };
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF generating error", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // const onSubmit = async (data) => {
  //   try {
  //     const contentToSave = getCombinedContent();
  //     await saveResumeFn(contentToSave);
  //     toast.success("Rsume saved successfully");
  //   } catch (error) {
  //     console.error("Save error", error);
  //   }
  // };

  const onSubmit = async (data) => {
    console.log(data);
    try {
      const formattedContent = previewContent
        .replace(/\n/g, "\n") // Normalize newlines
        .replace(/\n\s*\n/g, "\n\n") // Normalize multiple newlines to double newlines
        .trim();

      console.log(previewContent, formattedContent);
      await saveResumeFn({
        content: previewContent,
        formData: formValues,
      });
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  useEffect(() => {
    if (initialContent) {
      reset(initialContent);
      const initialMarkdown = getCombinedContent(); // 🧠 generate from form data
      setPreviewContent(initialMarkdown);
    }
  }, [initialContent, reset]);

  return (
    <div className=" space-y-4">
      <div className=" flex flex-col md:flex-row justify-between items-center gap-2">
        <h1 className=" font-bold gradient-title text-5xl md:text-6xl">
          Resume Builder
        </h1>
        <div className=" space-x-2">
          <Button
            variant="destructive"
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className=" h-4 w-4 animate-spin" />
                Saving Resume...
              </>
            ) : (
              <>
                <Save className=" h-4 w-4" />
                Save Resume
              </>
            )}
          </Button>
          <Button onClick={generatePDF} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className=" h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className=" h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="edit">Form</TabsTrigger>
          <TabsTrigger value="preview">Markdown</TabsTrigger>
        </TabsList>
        <TabsContent value="edit">
          <form className=" space-y-8" onSubmit={handleSubmit(onSubmit)}>
            <div className=" space-y-4">
              <h3 className=" text-lg font-medium">Contact Information</h3>
              <div className=" grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                <div className=" space-y-2">
                  <label className=" text-sm font-medium">Profession</label>
                  <Input
                    {...register("contactInfo.profession")}
                    type="text"
                    // placeholder="your@email.com"
                    error={errors.contactInfo?.profession}
                  />
                  {errors.contactInfo?.profession && (
                    <p className=" text-sm text-red-500">
                      {errors.contactInfo?.profession.message}
                    </p>
                  )}
                </div>

                <div className=" space-y-2">
                  <label className=" text-sm font-medium">Email</label>
                  <Input
                    {...register("contactInfo.email")}
                    type="email"
                    placeholder="your@email.com"
                    error={errors.contactInfo?.email}
                  />
                  {errors.contactInfo?.email && (
                    <p className=" text-sm text-red-500">
                      {errors.contactInfo?.email.message}
                    </p>
                  )}
                </div>

                <div className=" space-y-2">
                  <label className=" text-sm font-medium">Mobile Number</label>
                  <Input
                    {...register("contactInfo.mobile")}
                    type="tel"
                    placeholder="+1 234 567 8900"
                  />
                  {errors.contactInfo?.mobile && (
                    <p className=" text-sm text-red-500">
                      {errors.contactInfo?.mobile.message}
                    </p>
                  )}
                </div>

                <div className=" space-y-2">
                  <label className=" text-sm font-medium">LinkedIn URL</label>
                  <Input
                    {...register("contactInfo.linkedin")}
                    type="url"
                    placeholder="https://www.linkedin.com/in/your-profile"
                  />
                  {errors.contactInfo?.linkedin && (
                    <p className=" text-sm text-red-500">
                      {errors.contactInfo?.linkedin.message}
                    </p>
                  )}
                </div>

                {/* <div className=" space-y-2">
                  <label className=" text-sm font-medium">
                    Twitter/X Profile
                  </label>
                  <Input
                    {...register("contactInfo.twitter")}
                    type="url"
                    placeholder="https://www.twitter.com/your-handle"
                  />
                  {errors.contactInfo?.twitter && (
                    <p className=" text-sm text-red-500">
                      {errors.contactInfo?.twitter.message}
                    </p>
                  )}
                </div> */}

                <div className=" space-y-2">
                  <label className=" text-sm font-medium">Github URL</label>
                  <Input
                    {...register("contactInfo.github")}
                    type="url"
                    placeholder="https://www.github.com/your-profile"
                  />
                  {errors.contactInfo?.github && (
                    <p className=" text-sm text-red-500">
                      {errors.contactInfo?.github.message}
                    </p>
                  )}
                </div>

                <div className=" space-y-2">
                  <label className=" text-sm font-medium">Portfolio URL</label>
                  <Input
                    {...register("contactInfo.portfolio")}
                    type="url"
                    placeholder="https://www.your-portfolio.com"
                  />
                  {errors.contactInfo?.portfolio && (
                    <p className=" text-sm text-red-500">
                      {errors.contactInfo?.portfolio.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Summary */}
            <div className=" space-y-4">
              <h3 className="text-lg font-medium">Professional Summary</h3>
              <Controller
                name="summary"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className=" h-32"
                    placeholder="Write a compelling professional summary..."
                    error={errors.summary}
                  />
                )}
              />
              {errors.summary && (
                <p className=" text-sm text-red-500">
                  {errors.summary.message}
                </p>
              )}
            </div>

            {/* Skills */}
            <div className=" space-y-4">
              <h3 className="text-lg font-medium">Skills</h3>
              <Controller
                name="skills"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className=" h-32"
                    placeholder="List your key skills..."
                    error={errors.skills}
                  />
                )}
              />
              {errors.skills && (
                <p className=" text-sm text-red-500">{errors.skills.message}</p>
              )}
            </div>

            {/* Languages */}
            <div className=" space-y-4">
              <h3 className="text-lg font-medium">Languages Spoken</h3>
              <Controller
                name="languages"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className=" h-32"
                    placeholder="List your spoken languages and separated by commas (,)"
                    error={errors.languages}
                  />
                )}
              />
              {errors.languages && (
                <p className=" text-sm text-red-500">
                  {errors.languages.message}
                </p>
              )}
            </div>

            {/* Work Experience */}
            <div className=" space-y-4">
              <h3 className="text-lg font-medium">Work Experience</h3>
              <Controller
                name="experience"
                control={control}
                render={({ field }) => (
                  <EntryForm
                    type="Experience"
                    entries={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.experience && (
                <p className=" text-sm text-red-500">
                  {errors.experience.message}
                </p>
              )}
            </div>

            {/* Education */}
            <div className=" space-y-4">
              <h3 className="text-lg font-medium">Education</h3>
              <Controller
                name="education"
                control={control}
                render={({ field }) => (
                  <EntryForm
                    type="Education"
                    entries={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.education && (
                <p className=" text-sm text-red-500">
                  {errors.education.message}
                </p>
              )}
            </div>

            {/* projects */}
            <div className=" space-y-4">
              <h3 className="text-lg font-medium">Projects</h3>
              <Controller
                name="projects"
                control={control}
                render={({ field }) => (
                  <EntryForm
                    type="project"
                    entries={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.projects && (
                <p className=" text-sm text-red-500">
                  {errors.projects.message}
                </p>
              )}
            </div>
          </form>
        </TabsContent>
        <TabsContent value="preview">
          <Button
            variant="link"
            type="button"
            className="mb-2"
            onClick={() =>
              setResumeMode(resumeMode === "preview" ? "edit" : "preview")
            }
          >
            {resumeMode === "preview" ? (
              <>
                <Edit className=" h-4 w-4" />
                Edit Resume
              </>
            ) : (
              <>
                <Monitor className=" h-4 w-4" />
                Show Preview
              </>
            )}
          </Button>
          {resumeMode !== "preview" && (
            <div className="flex p-3 gap-2 items-center border-2 border-yellow-600 text-yellow-600 rounded mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm">
                You will lose editied markdown if you update the form data.
              </span>
            </div>
          )}
          <div className=" border rounded-lg">
            <MDEditor
              value={previewContent}
              onChange={setPreviewContent}
              height={800}
              preview={resumeMode}
            />
          </div>
          <div className="hidden">
            <div
              id="resume-pdf"
              className=" p-8 text-black bg-white"
              style={{
                pageBreakInside: "avoid",
                breakInside: "avoid",
                overflow: "hidden",
                width: "100%",
                fontFamily: "Arial, sans-serif",
                lineHeight: 1.6,
              }}
            >
              <MDEditor.Markdown
                source={previewContent}
                style={{
                  background: "white",
                  color: "black",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResumeBuilder;
