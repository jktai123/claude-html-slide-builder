# Notion Skills for Claude 快速指南

本指南為您整理了從 Notion 官方下載的 4 個 Claude 專屬 Notion 技能。這些技能已自動安裝至您專案的 `.agents/skills/` 目錄下，您可以在此 Workspace 直接調用這些技能。

## 🛠️ notion-knowledge-capture
**功能簡介**: Transforms conversations and discussions into structured documentation pages in Notion. Captures insights, decisions, and knowledge from chat context, formats appropriately, and saves to wikis or databases with proper organization and linking for easy discovery.

**安裝路徑**: `output/skills/knowledge-capture/notion-knowledge-capture/SKILL.md`

### Quick Start

When asked to save information to Notion:

1. **Extract content**: Identify key information from conversation context
2. **Structure information**: Organize into appropriate documentation format
3. **Determine location**: Use `Notion:notion-search` to find appropriate wiki page/database
4. **Create page**: Use `Notion:notion-create-pages` to save content
5. **Make discoverable**: Link from relevant hub pages, add to databases, or update wiki navigation so others can find it

---

## 🛠️ notion-meeting-intelligence
**功能簡介**: Prepares meeting materials by gathering context from Notion, enriching with Claude research, and creating both an internal pre-read and external agenda saved to Notion. Helps you arrive prepared with comprehensive background and structured meeting docs.

**安裝路徑**: `output/skills/meeting-intelligence/notion-meeting-intelligence/SKILL.md`

### Quick Start

When asked to prep for a meeting:

1. **Gather Notion context**: Use `Notion:notion-search` to find related pages
2. **Fetch details**: Use `Notion:notion-fetch` to read relevant content
3. **Enrich with research**: Use Claude's knowledge to add context, industry insights, or best practices
4. **Create internal pre-read**: Use `Notion:notion-create-pages` for background context document (for attendees)
5. **Create external agenda**: Use `Notion:notion-create-pages` for meeting agenda (shared with all participants)
6. **Link resources**: Connect both docs to related projects and each other

---

## 🛠️ notion-research-documentation
**功能簡介**: Searches across your Notion workspace, synthesizes findings from multiple pages, and creates comprehensive research documentation saved as new Notion pages. Turns scattered information into structured reports with proper citations and actionable insights.

**安裝路徑**: `output/skills/research-documentation/notion-research-documentation/SKILL.md`

### Quick Start

When asked to research and document a topic:

1. **Search for relevant content**: Use `Notion:notion-search` to find pages
2. **Fetch detailed information**: Use `Notion:notion-fetch` to read full page content
3. **Synthesize findings**: Analyze and combine information from multiple sources
4. **Create structured output**: Use `Notion:notion-create-pages` to write documentation

---

## 🛠️ notion-spec-to-implementation
**功能簡介**: Turns product or tech specs into concrete Notion tasks that Claude code can implement. Breaks down spec pages into detailed implementation plans with clear tasks, acceptance criteria, and progress tracking to guide development from requirements to completion.

**安裝路徑**: `output/skills/spec-to-implementation/notion-spec-to-implementation/SKILL.md`

### Quick Start

When asked to implement a specification:

1. **Find spec**: Use `Notion:notion-search` to locate specification page
2. **Fetch spec**: Use `Notion:notion-fetch` to read specification content
3. **Extract requirements**: Parse and structure requirements from spec
4. **Create plan**: Use `Notion:notion-create-pages` for implementation plan
5. **Find task database**: Use `Notion:notion-search` to locate tasks database
6. **Create tasks**: Use `Notion:notion-create-pages` for individual tasks in task database
7. **Track progress**: Use `Notion:notion-update-page` to log progress and update status

---


## 如何在 Claude 中使用這些技能
1. **自動觸發**：當您在對話中要求 Claude 執行如「準備會議議程」、「整理對話為 Notion Wiki」、「把 Spec 拆解成任務」或「在 Notion 搜尋並整理研究報告」時，Claude 會根據技能說明自動加載並遵循這些結構。
2. **指令呼叫**：您可以直接指示：`請使用 notion-spec-to-implementation 技能幫我把這份規格書整理成任務。`