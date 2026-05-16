import type { CanvaMcpAdapter, EditingOperationRequest } from "../adapters/canvaMcpAdapter.js";
import type {
  CanvaElement,
  CanvaLayoutSpec,
  CanvaPageSpec,
} from "../schemas/canvaLayoutSpec.schema.js";
import type { DesignProbe } from "./qualityChecker.js";
import { AgentError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export interface BuildResult {
  designId: string;
  editUrl: string | null;
  designProbe: DesignProbe;
  fontFallbacksUsed: string[];
}

export class CanvaCarouselBuilder {
  constructor(private readonly canva: CanvaMcpAdapter) {}

  async build(spec: CanvaLayoutSpec): Promise<BuildResult> {
    const created = await this.canva.createDesign({
      title: spec.design.title,
      width: spec.design.width,
      height: spec.design.height,
      unit: "px",
    });
    const designId = created.designId;
    logger.info({ designId }, "Canva design created (empty)");

    const transaction = await this.canva.startEditingTransaction(designId);
    const transactionId = transaction.transactionId;

    try {
      for (const page of spec.design.pages) {
        const ops = buildPageOperations(page);
        if (ops.length === 0) continue;
        const { elementIds } = await this.canva.performEditingOperations(
          designId,
          transactionId,
          ops,
        );
        logger.debug(
          { page: page.page_number, addedElements: elementIds.length },
          "page operations applied",
        );
      }
      await this.canva.commitEditingTransaction(designId, transactionId);
      logger.info({ designId, transactionId }, "Canva editing transaction committed");
    } catch (err) {
      await this.canva.cancelEditingTransaction(designId, transactionId);
      throw err;
    }

    const design = await this.canva.getDesign(designId);
    if (!design.editUrl) {
      throw new AgentError(
        "CANVA_DESIGN_CREATION_ERROR",
        `Canva design ${designId} was created but no edit URL is exposed.`,
      );
    }

    const probe: DesignProbe = {
      designId,
      editUrl: design.editUrl,
      pageCount: design.pageCount || spec.design.pages.length,
      width: design.width || spec.design.width,
      height: design.height || spec.design.height,
      perPageElementTypeCounts: buildElementTypeCounts(spec),
    };

    return {
      designId,
      editUrl: design.editUrl,
      designProbe: probe,
      fontFallbacksUsed: [],
    };
  }
}

export function buildPageOperations(page: CanvaPageSpec): EditingOperationRequest[] {
  const ops: EditingOperationRequest[] = [];
  ops.push({
    type: "add_page",
    args: {
      page_number: page.page_number,
      background: page.background,
    },
  });
  for (const el of page.elements) {
    ops.push(elementToOperation(page.page_number, el));
  }
  return ops;
}

function elementToOperation(
  pageNumber: number,
  el: CanvaElement,
): EditingOperationRequest {
  const base = {
    page_number: pageNumber,
    role: el.role,
    bbox: { x: el.x, y: el.y, w: el.w, h: el.h },
    editable: el.editable,
  };
  switch (el.type) {
    case "text":
      return {
        type: "add_text",
        args: {
          ...base,
          text: el.text,
          style: el.style,
        },
      };
    case "image":
      return {
        type: "add_image",
        args: {
          ...base,
          asset_id: el.asset_id,
          source_path: el.source_path,
          fit: el.fit,
          opacity: el.opacity,
        },
      };
    case "shape":
      return {
        type: "add_shape",
        args: {
          ...base,
          shape: el.shape,
          fill: el.fill,
          border_color: el.border_color,
          border_width: el.border_width,
          border_radius: el.border_radius,
          opacity: el.opacity,
        },
      };
    case "line":
      return {
        type: "add_line",
        args: {
          ...base,
          stroke: el.stroke,
          stroke_width: el.stroke_width,
          opacity: el.opacity,
        },
      };
    default: {
      const _exhaustive: never = el;
      throw new Error(`Unhandled element: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

export function buildElementTypeCounts(
  spec: CanvaLayoutSpec,
): Record<number, Record<string, number>> {
  const out: Record<number, Record<string, number>> = {};
  for (const page of spec.design.pages) {
    const counts: Record<string, number> = {};
    for (const el of page.elements) {
      counts[el.type] = (counts[el.type] ?? 0) + 1;
    }
    out[page.page_number] = counts;
  }
  return out;
}
