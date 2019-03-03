from proof_visualization.model.dag import Dag
from proof_visualization.model.traversal import DFPostOrderTraversal


# return ids of nodes, which have a derivation where each of the nodes in relevant_ids occurs
def find_common_consequences(dag, relevant_ids):
    assert isinstance(dag, Dag)
    assert isinstance(relevant_ids, set)
    for relevant_id in relevant_ids:
        assert isinstance(relevant_id, int)

    # create dictionary which for each nodeId keep track of which relevant_ids occur in the derivation
    id_to_relevant_parents = {}

    # want to compute common consequences
    common_consequences = []

    # add all transitive children of ids in transitiveChildren to transitiveChildren
    post_order_traversal = DFPostOrderTraversal(dag)
    while post_order_traversal.has_next():
        current_node = post_order_traversal.get_next()
        current_node_id = current_node.number

        # compute relevant parents and update dictionary
        if current_node_id in relevant_ids:
            relevant_parents = {current_node_id}
        else:
            relevant_parents = set()
        for parentId in current_node.parents:
            print(parentId)
            # print(id_to_relevant_parents[parentId]) TODO fix
            if parentId in id_to_relevant_parents:
                relevant_parents.update(id_to_relevant_parents[parentId])
                id_to_relevant_parents[current_node_id] = relevant_parents

        # check whether each relevant id occurs in relevant parents
        print("len relevant_ids: " + str(len(relevant_ids)))
        print("len relevant_parents: " + str(len(relevant_parents)))
        if len(relevant_ids) == len(relevant_parents):
            common_consequences.append(current_node_id)

    print(common_consequences)
    return common_consequences
