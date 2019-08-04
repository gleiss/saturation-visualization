import * as React from 'react';
import {DataSet, IdType, Network} from 'vis'
import * as Viz from 'viz.js';
import {Module, render} from 'viz.js/full.render.js';

import Dag from '../model/dag';
import SatNode from '../model/sat-node';
import NetworkNode from '../model/network/network-node';
import NetworkEdge from '../model/network/network-edge';
import {Color, ColorStyle, EdgeColor, FontStyle} from '../model/network/network-style';
import './Graph.css'


const styleTemplates = require('../resources/styleTemplates');
const PLAIN_PATTERN = /^node (\d+) ([0-9.]+) ([0-9.]+) [0-9.]+ [0-9.]+ ".+" [a-zA-Z ]+$/g;

type Props = {
  dag: Dag,
  nodeSelection: number[],
  historyState: number,
  onNetworkChange: (network: Network, nodes: DataSet<NetworkNode>, edges: DataSet<any>) => void,
  onNodeSelectionChange: (selection: number[]) => void
};
type State = {
  dag: Dag,
  nodeSelection: number[],
  historyState: number
};
export default class Graph extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      dag: props.dag,
      nodeSelection: props.nodeSelection,
      historyState: props.historyState
    }
  }

  private markers: IdType[] = [];
  private network: Network | null = null;
  private networkNodes: DataSet<NetworkNode> = new DataSet([]);
  private graphContainer = React.createRef<HTMLDivElement>();

  async componentDidMount() {
    await this.generateNetwork();
  }

  async componentDidUpdate(prevProps: Props) {
    if (this.props.dag !== prevProps.dag) {
      await this.generateNetwork();
    }
  }

  render() {
    return (
      <section className="component-graph" ref={this.graphContainer}>
        <canvas/>
      </section>
    );
  }


  // NETWORK ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  async generateNetwork() {
    const {onNetworkChange, onNodeSelectionChange} = this.props;
    const graph = await this.generateNetworkData();
    this.networkNodes = new DataSet(graph.networkNodes);
    const networkEdges = new DataSet(graph.networkEdges);

    if (this.graphContainer.current) {
      if (this.network) {
        this.network.destroy();
      }

      this.network = new Network(this.graphContainer.current, {
        nodes: this.networkNodes,
        edges: networkEdges
      }, this.getNetworkOptions());

      this.network.on('select', (newSelection) => onNodeSelectionChange(newSelection.nodes));
      this.network.on('oncontext', (rightClickEvent) => {
        const nodeId = this.findNodeAt(rightClickEvent.event);
        if (nodeId) {
          this.toggleMarker(nodeId);
        }
        rightClickEvent.event.preventDefault();
      });

      this.applyStoredMarkers(this.networkNodes);

      onNetworkChange(this.network, this.networkNodes, networkEdges);
    }
  }

  async generateNetworkData(): Promise<{ networkNodes: NetworkNode[], networkEdges: NetworkEdge[] }> {
    const {dag, historyState} = this.props;
    const networkNodes: NetworkNode[] = [];
    const networkEdges: NetworkEdge[] = [];
    const positions = await this.computePositions(dag ? Object.values(dag.nodes) : []);

    positions.forEach(position => {
      const node = dag ? dag.get(position.id) : null;
      if (node) {
        networkNodes.push(this.toNetworkNode(node, position, historyState));

        const edgesVisible = node.isFromPreprocessing || !!(node.newTime && node.newTime <= historyState);
        node
          .parents
          .forEach(parentId => {
            if (dag && dag.get(parentId)) {
              networkEdges.push(this.toNetworkEdge(parentId, node.id, edgesVisible))
            }
          });
      }
    });

    return {networkNodes, networkEdges};
  }

  findNodeAt(clickPosition: { layerX: number, layerY: number }): IdType {
    return this.network!.getNodeAt({
      x: clickPosition.layerX,
      y: clickPosition.layerY
    });
  }

  getNetworkOptions = (): any => {
    return {
      physics: false,
      interaction: {
        multiselect: true
      }
    };
  };


  // POSITIONING ///////////////////////////////////////////////////////////////////////////////////////////////////////

  toDotString(nodes: SatNode[]): string {
    const dotStrings: string[] = [];

    nodes.forEach(node => {
      dotStrings.push(`${node.id} [label="${node.clause}"]`);
      node
        .parents
        .forEach(parent => dotStrings.push(`${parent} -> ${node.id}`));
    });

    return `digraph { ${dotStrings.join('; ')} }`;
  };

  async toGraphLayout(nodes: SatNode[]) {
    let viz = new Viz({Module, render});

    return viz
      .renderString(this.toDotString(nodes), {format: 'plain'})
      .then((result: any) => {
        return result;
      })
      .catch((error: any) => {
        viz = new Viz({Module, render});
        console.error(error);
      });
  };

  async computePositions(nodes: SatNode[]): Promise<{ id: number, x: number, y: number }[]> {
    const graphLayout = await this.toGraphLayout(nodes);
    return graphLayout
      .split('\n')
      .filter((line: string) => line.startsWith('node'))
      .map((line: string) => line.matchAll(PLAIN_PATTERN).next().value)
      .filter((match: any[]) => !!match)
      .map((match: any[]) => {
        const [, number, x, y] = match;
        return {
          id: parseInt(number, 10),
          x: parseFloat(x),
          y: parseFloat(y)
        };
      });
  };


  // STYLING ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  selectStyle = (node: SatNode, historyState: number): any => {
    if (node.inferenceRule === 'theory axiom') {
      if (node.activeTime && node.activeTime <= historyState) {
        return styleTemplates.activeTheoryAxiom;
      } else if (node.passiveTime && node.passiveTime <= historyState) {
        return styleTemplates.passiveTheoryAxiom;
      }
    }

    if (node.isFromPreprocessing) {
      return node.parents ? styleTemplates.preprocessing : styleTemplates.input;
    }

    if (node.activeTime && node.activeTime <= historyState) {
      return styleTemplates.active;
    } else if (node.passiveTime && node.passiveTime <= historyState) {
      return styleTemplates.passive;
    } else if (node.newTime && node.newTime < historyState) {
      return styleTemplates.new;
    }

    return styleTemplates.hidden;
  };

  setStyle = (node: NetworkNode, newStyleKey: string) => {
    const newStyle = node.color.get(newStyleKey);

    node.color.background = newStyle.background;
    node.color.border = newStyle.border;
  };

  toNetworkNode = (node: SatNode, position: { x: number, y: number }, historyState: number): NetworkNode => {
    const styleData = this.selectStyle(node, historyState);

    return {
      id: node.id,
      color: this.getColorStyle(styleData),
      font: new FontStyle(styleData.text),
      label: node.clause,
      rule: node.inferenceRule,
      shape: styleData.shape,
      x: Math.round(position.x * -70),
      y: Math.round(position.y * -120)
    }
  };

  toNetworkEdge = (fromNode: number, toNode: number, visible: boolean): NetworkEdge => {
    return {
      arrows: 'to',
      color: new EdgeColor(visible ? 1.0 : 0.0, '#dddddd'),
      from: fromNode,
      to: toNode
    }
  };

  getColorStyle = (styleData: any): ColorStyle => {
    return new ColorStyle(
      styleData.defaultStyle.background,
      styleData.defaultStyle.border,
      new Color(styleData.defaultStyle.background, styleData.defaultStyle.border),
      new Color(styleData.highlightStyle.background, styleData.highlightStyle.border),
      new Color(styleData.markedStyle.background, styleData.markedStyle.border)
    )
  };


  // MARKERS ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  private applyStoredMarkers(availableNodes: DataSet<NetworkNode>) {
    this.markers
      .map(nodeId => availableNodes.get(nodeId))
      .forEach(node => {
        if (node) {
          this.setStyle(node, 'markedStyle');
          availableNodes.update(node);
        }
      });
  };

  private toggleMarker(nodeId: IdType) {
    if (!this.networkNodes) {
      return;
    }
    const node = this.networkNodes.get(nodeId);
    const markerSet: Set<IdType> = new Set(this.markers);

    if (node) {
      if (markerSet.has(node.id)) {
        markerSet.delete(node.id);
        this.setStyle(node, 'defaultStyle');
      } else {
        markerSet.add(node.id);
        this.setStyle(node, 'markedStyle');
      }
      this.markers = Array.from(markerSet);
      this.networkNodes.update(node);
    }
  };

}
