from proof_visualization.model.dag import Dag
from proof_visualization.model.node import Node
from proof_visualization.model.traversal import DFPostOrderTraversal
from proof_visualization.model.traversal import ReversePostOrderTraversal

# return ids of nodes, which have a derivation where each of the nodes in relevantIds occurs
def findCommonConsequences(dag, relevantIds):
    assert isinstance(dag, Dag)
    assert isinstance(relevantIds, set)
    for relevantId in relevantIds:
        assert isinstance(relevantId, int)

    # create dictionary which for each nodeId keep track of which relevantIds occur in the derivation
    idToRelevantParents = dict()

    # want to compute common consequences
    commonConsequences = list()

    # add all transitive children of ids in transitiveChildren to transitiveChildren
    postOrderTraversal = DFPostOrderTraversal(dag)
    while(postOrderTraversal.hasNext()):
        currentNode = postOrderTraversal.getNext()
        currentNodeId = currentNode.number

        # compute relevant parents and update dictionary
        if currentNodeId in relevantIds:
            relevantParents = {currentNodeId}
        else:
            relevantParents = set()
        for parentId in currentNode.parents:
            print(parentId)
            print(idToRelevantParents[parentId])
            if parentId in idToRelevantParents:
                relevantParents.update(idToRelevantParents[parentId])
        idToRelevantParents[currentNodeId] = relevantParents
        
        # check whether each relevant id occurs in relevant parents
        print("len relevantIds: " + str(len(relevantIds)))
        print("len relevantParents: " + str(len(relevantParents)))
        if len(relevantIds) == len(relevantParents):
            commonConsequences.append(currentNodeId)

    print(commonConsequences)
    return commonConsequences