// RESET ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
const reset = () => {
  document.getElementById('search').value = '';
  document.getElementById('searchResults').innerHTML = '';
  document.getElementById('searchResults').classList.remove('focused');
};

// GRAPH ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
const drawGraph = () => {
  const parent = document.getElementById('graph');
  const options = {
    physics: false,
    interaction: {
      multiselect: true
    }
  };
  const viewPosition = resetSession ? undefined : JSON.parse(sessionStorage.getItem('viewPosition') || null);
  const scale = resetSession ? undefined : sessionStorage.getItem('scale');

  network = new vis.Network(parent, {'nodes': nodes, 'edges': edges}, options);
  if (viewPosition && scale) {
    network.moveTo({
      scale: scale,
      position: viewPosition
    })
  }

  network.on('afterDrawing', () => {
    sessionStorage.setItem('viewPosition', JSON.stringify(network.getViewPosition()));
    sessionStorage.setItem('scale', network.getScale());
  });
  network.on('select', (change) => {
    selection = change.nodes;
    updateSelection();
  });
  network.on('oncontext', (rightClickEvent) => {
    rightClickEvent.event.preventDefault();
    const clickedNodeId = network.getNodeAt({
      x: rightClickEvent.event.layerX,
      y: rightClickEvent.event.layerY
    });
    if (!clickedNodeId) {
      return;
    }

    const clickedNode = nodes.get(clickedNodeId);
    if (marked.has(clickedNodeId)) {
      // remove marker
      marked.delete(clickedNodeId);
      clickedNode.color.background = clickedNode.color.default.background;
      clickedNode.color.border = clickedNode.color.default.border;
    } else {
      // add marker
      marked.add(clickedNodeId);
      clickedNode.color.background = clickedNode.color.marked.background;
      clickedNode.color.border = clickedNode.color.marked.border;
    }
    nodes.update(clickedNode);
    updateMarkers();
  });
};

const preSelectNodes = () => {
  network.selectNodes(selection);
  updateSelection();
};

const updateSelection = () => {
  document.getElementById('consequenceSelection').value = selection;
  document.getElementById('transformationSelection').value = selection;
  document.getElementById('historySelection').value = selection;

  const nodeCount = selection.length;
  document.getElementById('nodeCount').innerText = nodeCount === 1 ? '1 node' : `${nodeCount} nodes`;

  const selectionButtonsDisabled = nodeCount === 0;
  document.getElementById('selectDown').disabled = selectionButtonsDisabled;
  document.getElementById('selectUp').disabled = selectionButtonsDisabled;
  document.getElementById('selectParents').disabled = selectionButtonsDisabled;
  document.getElementById('selectChildren').disabled = selectionButtonsDisabled;
  document.getElementById('findCommonConsequences').disabled = nodeCount <= 1;

  if (nodeCount === 1) {
    // display node details
    const node = nodes.get(selection[0]);
    document.getElementById('nodeInfo').classList.add('hidden');
    document.getElementById('nodeDetails').classList.remove('hidden');
    document.getElementById('nodeDetailsId').innerText = `#${node.id}`;
    document.getElementById('nodeDetailsClause').innerText = node.label;
    document.getElementById('nodeDetailsRule').innerText = node.rule;
  } else {
    // hide node details
    document.getElementById('nodeInfo').classList.remove('hidden');
    document.getElementById('nodeDetails').classList.add('hidden');
  }
};

const preMarkNodes = () => {
  const nodesToUpdate = [];
  marked.forEach(nodeId => {
    const node = nodes.get(nodeId);
    if (node) {
      node.color.background = node.color.marked.background;
      node.color.border = node.color.marked.border;
      nodesToUpdate.push(node)
    }
  });
  nodes.update(nodesToUpdate);
  updateMarkers();
};

const updateMarkers = () => {
  const markerList = Array.from(marked);
  document.getElementById('consequenceMarkers').value = markerList;
  document.getElementById('transformationMarkers').value = markerList;
  document.getElementById('historyMarkers').value = markerList;
};

// HISTORY SLIDE ///////////////////////////////////////////////////////////////////////////////////////////////////////
const renderSlide = () => {
  const slide = document.createElement('input');
  slide.type = 'range';
  slide.min = 0;
  slide.max = historyLength - 1;
  slide.value = historyState;
  slide.name = 'slide';
  slide.onchange = function () {
    this.form.submit()
  };

  const parent = document.getElementById('slideContainer');
  parent.appendChild(slide);
};

const updateSlideValueDisplay = () => {
  const slideValueDisplay = document.getElementById('slideValue');
  slideValueDisplay.innerText = historyState;
  slideValueDisplay.setAttribute('style', `left: ${historyState * 100 / (historyLength - 1)}%`);
};

// FILE UPLOAD /////////////////////////////////////////////////////////////////////////////////////////////////////////
const chooseFile = () => document.getElementById('fileSelector').click();

const uploadFile = (files) => {
  const reader = new FileReader();
  reader.readAsText(files[0]);
  reader.onloadend = () => {
    document.getElementById('fileUpload').value = reader.result;
    document.getElementById('fileForm').submit();
  };
};

// SELECTION ////////////////////////////////////////////////////////////////////////////////////////////////////
const selectParents = () => {
  const newSelectionSet = new Set(selection);
  selection.forEach(selectedNodeId => {
    network.getConnectedEdges(selectedNodeId).forEach(edgeId => {
      const edge = edges.get(edgeId);
      if (edge.to === selectedNodeId) {
        newSelectionSet.add(edge.from);
      }
    })
  });
  const newSelection = [...newSelectionSet];
  network.selectNodes(newSelection);
  selection = newSelection;
  updateSelection();
};

const selectChildren = () => {
  const newSelectionSet = new Set(selection);
  selection.forEach(selectedNodeId => {
    network.getConnectedEdges(selectedNodeId).forEach(edgeId => {
      const edge = edges.get(edgeId);
      if (edge.from === selectedNodeId) {
        newSelectionSet.add(edge.to);
      }
    })
  });
  const newSelection = [...newSelectionSet];
  network.selectNodes(newSelection);
  selection = newSelection;
  updateSelection();
};

// SEARCH //////////////////////////////////////////////////////////////////////////////////////////////////////////////
const search = (value) => {
  if (!value) {
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('searchResults').classList.remove('focused');
    return;
  }
  let selectedNodes = Object.values(nodes._data).filter(node => node.label.includes(value));
  selectedNodes.sort((a, b) => {
    return a.label.length - b.label.length;
  });
  selection = selectedNodes.map(node => node.id);
  network.selectNodes(selection);
  updateSelection();

  const resultContainer = document.getElementById('searchResults');
  let prunedNodes;
  if (selectedNodes.length > 20) {
    prunedNodes = selectedNodes.slice(0,21);
  } else {
    prunedNodes = selectedNodes;
  }

  let resultList = prunedNodes.map(node => {
    if (node.label === 'Preproc') {
      return ''
    }
    return `<li onclick="selectNode(${node.id})">${node.label}</li>`
  }).join('');
  resultContainer.classList.add('focused');
  if (selectedNodes.length > 20) {
    resultList = resultList + '<li>...</li>';
  }
  resultContainer.innerHTML = resultList;
};

const selectNode = (nodeId) => {
  network.selectNodes([nodeId]);
  selection = [nodeId];
  updateSelection();
};

// LEGEND //////////////////////////////////////////////////////////////////////////////////////////////////////////////
const drawLegend = () => {
  const parent = document.getElementById('legendGraph');
  const options = {
    physics: false,
    interaction: {
      dragNodes: false,
      dragView: false,
      keyboard: {
        enabled: false
      },
      selectable: false,
      zoomView: false
    }
  };
  // const legendNetwork = new vis.Network(parent, {'nodes': legendNodes}, options);
};


// CALLS ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
reset();
drawGraph();
preMarkNodes();
preSelectNodes();
renderSlide();
updateSlideValueDisplay();
