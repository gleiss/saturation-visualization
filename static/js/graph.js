(function () {

    let data = JSON.parse(dagJson);
    let nodes = new vis.DataSet(data.graph.nodes);
    let edges = new vis.DataSet(data.graph.edges);
    let network = null;

    const drawGraph = () => {
        const parent = document.getElementById('graph');
        const options = {
            physics: false
        };
        network = new vis.Network(parent, { 'nodes': nodes, 'edges': edges }, options);
    };

    const reDrawGraph = () => {
        network.setData({ 'nodes': nodes, 'edges': edges });
    };

    const resetData = () => {
        data = JSON.parse(dagJson);
        nodes = new vis.DataSet(data.graph.nodes);
        edges = new vis.DataSet(data.graph.edges);
    };

    const updateNodeVisibility = (latestVisible) => {
        resetData();
        const updatedNodes = [];
        const updatedNodeIds = [];
        const updatedEdges = [];
        data.order.slice(latestVisible).forEach((nodeId) => {
            const node = nodes.get(nodeId);
            node.color.border = 'rgba(255, 255, 255, 0)';
            node.color.background = 'rgba(255, 255, 255, 0)';
            updatedNodes.push(node);
            updatedNodeIds.push(nodeId);
        });
        data.graph.edges.forEach((edge) => {
            if (updatedNodeIds.includes(edge.from) || updatedNodeIds.includes(edge.to)) {
                edge.color = {
                    'color': 'rgba(255,255,255,0)'
                };
                updatedEdges.push(edge);
            }
        });
        nodes.update(updatedNodes);
        edges.update(updatedEdges);
        reDrawGraph();
    };

    const renderSlide = () => {
        const slide = document.createElement('input');
        slide.type = 'range';
        slide.min = 1;
        slide.max = data.order.length;
        slide.value = data.order.length;
        slide.onchange = () => updateNodeVisibility(slide.value);

        const parent = document.getElementById('slidecontainer');
        while (parent.firstChild) {
            parent.removeChild(firstChild);
        }
        parent.appendChild(slide);
    };

    drawGraph();
    renderSlide();

})();
