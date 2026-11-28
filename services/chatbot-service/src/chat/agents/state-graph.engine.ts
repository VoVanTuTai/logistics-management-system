import { Logger } from '@nestjs/common';

export const GRAPH_START = '__START__';
export const GRAPH_END = '__END__';

export type NodeAction<S> = (state: S) => Promise<Partial<S> | void> | Partial<S> | void;
export type EdgeRouter<S> = (state: S) => string;

export interface GraphStepTrace {
  node: string;
  next: string;
  latencyMs: number;
  hop: number;
}

/**
 * Lightweight, strongly-typed StateGraph runtime (LangGraph-style execution model)
 * supporting deterministic edges, conditional agent routing, multi-agent handoffs,
 * reflection retry loops, and cycle protection via maxHops.
 */
export class StateGraph<S extends { graphTrace?: GraphStepTrace[] }> {
  private readonly logger = new Logger(StateGraph.name);
  private readonly nodes = new Map<string, NodeAction<S>>();
  private readonly edges = new Map<string, string>();
  private readonly conditionalEdges = new Map<string, EdgeRouter<S>>();
  private entryPoint: string | null = null;

  addNode(name: string, action: NodeAction<S>): this {
    if (name === GRAPH_START || name === GRAPH_END) {
      throw new Error(`Reserved node name: ${name}`);
    }
    this.nodes.set(name, action);
    return this;
  }

  setEntryPoint(nodeName: string): this {
    this.entryPoint = nodeName;
    return this;
  }

  addEdge(from: string, to: string): this {
    this.edges.set(from, to);
    return this;
  }

  addConditionalEdges(from: string, router: EdgeRouter<S>): this {
    this.conditionalEdges.set(from, router);
    return this;
  }

  compile(maxHops = 10): CompiledStateGraph<S> {
    if (!this.entryPoint || !this.nodes.has(this.entryPoint)) {
      throw new Error(`Invalid StateGraph entry point: ${this.entryPoint}`);
    }
    return new CompiledStateGraph<S>(
      this.entryPoint,
      new Map(this.nodes),
      new Map(this.edges),
      new Map(this.conditionalEdges),
      maxHops,
      this.logger,
    );
  }
}

export class CompiledStateGraph<S extends { graphTrace?: GraphStepTrace[] }> {
  constructor(
    private readonly entryPoint: string,
    private readonly nodes: Map<string, NodeAction<S>>,
    private readonly edges: Map<string, string>,
    private readonly conditionalEdges: Map<string, EdgeRouter<S>>,
    private readonly maxHops: number,
    private readonly logger: Logger,
  ) {}

  async invoke(initialState: S): Promise<S> {
    let state: S = {
      ...initialState,
      graphTrace: [...(initialState.graphTrace || [])],
    };

    let currentNode: string = this.entryPoint;
    let hop = 0;

    while (currentNode !== GRAPH_END) {
      hop += 1;
      if (hop > this.maxHops) {
        this.logger.warn(`StateGraph exceeded maxHops=${this.maxHops} at node "${currentNode}", terminating cleanly.`);
        break;
      }

      const action = this.nodes.get(currentNode);
      if (!action) {
        throw new Error(`StateGraph node not found: ${currentNode}`);
      }

      const nodeStart = Date.now();
      const patch = await action(state);
      if (patch && typeof patch === 'object') {
        state = { ...state, ...patch };
      }

      let nextNode = GRAPH_END;
      const condRouter = this.conditionalEdges.get(currentNode);
      if (condRouter) {
        nextNode = condRouter(state);
      } else if (this.edges.has(currentNode)) {
        nextNode = this.edges.get(currentNode)!;
      }

      state.graphTrace = [
        ...(state.graphTrace || []),
        {
          node: currentNode,
          next: nextNode,
          latencyMs: Date.now() - nodeStart,
          hop,
        },
      ];

      currentNode = nextNode;
    }

    return state;
  }
}
