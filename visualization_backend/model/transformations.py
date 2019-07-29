from visualization_backend.model.dag import Dag
from visualization_backend.model.node import Node
from visualization_backend.model.traversal import ReversePostOrderTraversal, DFPostOrderTraversal


# returns a new dag containing only the nodes which either
# have an id in relevant_ids or
# are transitive parents of a node with id in relevant_ids
def filter_non_parents(dag, relevant_ids):
    assert isinstance(dag, Dag)
    assert isinstance(relevant_ids, set)
    for relevant_id in relevant_ids:
        assert isinstance(relevant_id, int)

    # use new set to avoid mutating relevant_ids
    transitive_parents = relevant_ids

    # need to compute remaining nodes
    remaining_nodes = dict()

    # add all transitive parents of transitive_parents to transitive_parents
    iterator = ReversePostOrderTraversal(dag)
    while iterator.has_next():
        current_node = iterator.get_next()
        current_node_id = current_node.number

        # if current_node is relevant
        if current_node_id in transitive_parents:

            # mark parents relevant
            for parent_id in current_node.parents:
                transitive_parents.add(parent_id)

            # add node to remaining_nodes
            remaining_nodes[current_node_id] = current_node

    return Dag(remaining_nodes)


# returns a new dag containing only the nodes which either
# have an id in relevant_ids or
# are transitive children of a node with id in relevant_ids.
# additionally keeps boundary nodes
def filter_non_consequences(dag, relevant_ids):
    assert isinstance(dag, Dag)
    assert isinstance(relevant_ids, set)
    for relevant_id in relevant_ids:
        assert isinstance(relevant_id, int)

    # use new set to avoid mutating relevant_ids
    transitive_children = relevant_ids

    # need to compute remaining nodes
    remaining_nodes = dict()

    # add all transitive children of ids in transitive_children to transitive_children
    post_order_traversal = DFPostOrderTraversal(dag)
    while post_order_traversal.has_next():
        current_node = post_order_traversal.get_next()
        current_node_id = current_node.number

        # check if current_node occurs in transitive_children or
        # has a parent which occurs in transitive_children
        exists_relevant_parent = False
        for parent_id in current_node.parents:
            if parent_id in transitive_children:
                exists_relevant_parent = True
        is_relevant = (current_node_id in transitive_children) or exists_relevant_parent

        if is_relevant:
            # add its id to the set of relevant ids
            transitive_children.add(current_node_id)

            # if there exists at least one relevant parent, introduce boundary nodes for all nonrelevant parents
            if exists_relevant_parent:
                # add a boundary node for each parent which doesn't occurs in transitive_children
                for parent_id in current_node.parents:
                    if parent_id not in transitive_children:
                        boundary_node = create_boundary_node(dag, dag.get(parent_id))
                        boundary_node_id = boundary_node.number

                        assert boundary_node_id not in dag.leaves
                        # boundary_node has current_node as child and is therefore no leaf
                        remaining_nodes[boundary_node_id] = boundary_node

            # otherwise ignore all parents: introduce a copy of the node which has no parents
            else:
                current_node = create_boundary_node(dag, current_node)

            # add node to remaining_nodes
            remaining_nodes[current_node_id] = current_node

    return Dag(remaining_nodes)


# create a boundary node, which has the same id as the Node node, but as inference "Boundary" and no parents
def create_boundary_node(dag, node):
    assert (isinstance(dag, Dag))
    assert (isinstance(node, Node))

    boundary_node = Node(node.number, node.clause, "Boundary", [], node.statistics, node.is_from_preprocessing)
    if node.new_time is not None:
        boundary_node.set_new_time(node.new_time)
    if node.passive_time is not None:
        boundary_node.set_passive_time(node.passive_time)
    if node.active_time is not None:
        boundary_node.set_active_time(node.active_time)

    return boundary_node


# remove all nodes, which are not used to derive any clause which is activated at some point
# (note that the derivation of an activated clause can contain never activated passive nodes or even clauses which have
# never been added to passive)
def filter_non_active_deriving_nodes(dag):
    # collect all active nodes
    activated_nodes = set()
    for _, node in dag.nodes.items():
        if node.active_time is not None:
            activated_nodes.add(node.number)

    # remove all nodes which are not transitive parents of activated nodes
    transformed_dag = filter_non_parents(dag, activated_nodes)

    return transformed_dag


# vampire performs preprocessing in multiple steps
# we are only interested in
# 1) the input-formulas (and axioms added by Vampire)
# 2) the clauses resulting from them
# We therefore merge together all preprocessing steps into single steps
# from input-formulas/vapire-added-axioms to final-preprocessing-clauses
# additionally remove all choice axiom parents, since we treat them as part of the background theory
def merge_preprocessing(dag):
    post_order_traversal = DFPostOrderTraversal(dag)
    while post_order_traversal.has_next():
        current_node = post_order_traversal.get_next()

        # if there is a preprocessing node n1 with a parent node n2 which has itself a parent node n3,
        # then replace n2 by n3 in the parents of n1
        if current_node.is_from_preprocessing:
            new_parents = []
            for parent_id in current_node.parents:
                parent_node = dag.get(parent_id)
                assert parent_node.is_from_preprocessing

                if len(parent_node.parents) == 0:
                    if parent_node.inference_rule != "choice axiom":
                        new_parents.append(parent_id)

                for parent_2_id in parent_node.parents:
                    parent_2_node = dag.get(parent_2_id)
                    assert parent_2_node.is_from_preprocessing

                    new_parents.append(parent_2_id)

            current_node.parents = new_parents

    # remove unused nodes like n2.
    # not that they are now not reachable anymore from the leaves of the dag
    remaining_nodes = dict()
    post_order_traversal_2 = DFPostOrderTraversal(dag)
    while post_order_traversal_2.has_next():
        current_node = post_order_traversal_2.get_next()
        current_id = current_node.number
        remaining_nodes[current_id] = current_node

    return Dag(remaining_nodes)
