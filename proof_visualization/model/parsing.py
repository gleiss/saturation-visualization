"""A parser for vampire output"""

import logging
import re
from collections import namedtuple

from proof_visualization.model.dag import Dag
from proof_visualization.model.node import Node

import proof_visualization.model.util as util

__all__ = 'process', 'parse', 'analyse'

LOG = logging.getLogger('VampireParser')
OUTPUT_PATTERN = re.compile(r'^(\[[A-Z]{2}\] [a-z]{5,7}): (\d+)\. (.*) \(([\d:]+)\)([T ]+)\[(\D*) ?([\d,]*)\]$')

PREPROCESSING_LABEL = 'Preproc'

ParsedLine = namedtuple('ParsedLine', ['type', 'number', 'clause', 'statistics', 'inference_rule', 'parents'])


def process(vampire_output):
    lines = parse(vampire_output)
    return analyse(lines), len(lines)


def parse(vampire_output):
    """Parse vampire output line by line and build a DAG.

    """

    lines = vampire_output.replace('\r\n', '\n').replace('\r', '\n').split('\n')
    return [parsed_line for parsed_line in (parse_line(line) for line in lines) if parsed_line]


def parse_line(line):
    try:
        type_, number, clause, statistics, _, inference_rule, parents = re.match(OUTPUT_PATTERN, line).groups()
        type_ = type_.split(']')[1].strip()
        number = int(number)
        clause = util.remove_quotes(clause.rstrip())
        statistics = [int(stat) for stat in statistics.split(':')]
        inference_rule = inference_rule.rstrip()
        parents = [int(parent) for parent in parents.split(',') if parent]
        # if type_ == "final":
        #     print("Parsed preprocessing line with id %s", number)
        # # if type_ == "passive":
        # #    print("Parsed passive line with id %s", number)
        # if type_ == "active":
        #     print("Parsed active line with id %s", number)

        return ParsedLine(type_, number, clause, statistics, inference_rule, parents)
    except AttributeError:
        LOG.warning('\'%s\' does not match the pattern and will be skipped', line)


def analyse(parsed_lines):
    """Build a DAG from parsed vampire output lines."""

    nodes = {}
    for index, line in enumerate(parsed_lines):

        existing_node = nodes.get(line.number)
        
        if existing_node == None:
            if line.type == "active":
                print(index)
                LOG.warning("Found clause with id %s, which was added to active, but wasn't added to passive before. Maybe you forgot to output the passive clauses?", line.number)
                assert(False)

            assert(line.type == "final" or line.type == "passive")
            current_node = Node(line.number, line.clause, line.inference_rule, line.parents, line.statistics)
            nodes[line.number] = current_node
        else:
            assert(line.number == existing_node.number)
            # TODO: the literals in the clause occur not necessarily always in the same order. Should parse them separately, order them consistently and then compare. Parsing them is not much extra implementation effort, since we anyway need it for later features.
            # if not line.clause == existing_node.clause:
            #     print(line.clause)
            #     print(existing_node.clause)
            # assert(line.clause == existing_node.clause)
            # TODO: collect the selected literal, which is only there at some point (probably at the point where the clause gets activated)
            # if not line.statistics == existing_node.statistics:
            #     print(line.statistics)
            #     print(existing_node.statistics)
            # assert(line.statistics == existing_node.statistics)
            assert(line.inference_rule == existing_node.inference_rule)
            assert(line.parents == existing_node.parents)

            assert((line.type == "passive" and existing_node.passive_time == None and existing_node.active_time == None) or (line.type == "active" and (not existing_node.passive_time == None) and existing_node.active_time == None))
            current_node = existing_node

        # set line type info
        if line.type == 'final':
            # clause occurs in final preprocessing
            current_node.is_from_preprocessing = True
        elif line.type == 'passive':
            current_node.set_passive_time(index)
        elif line.type == 'active':
            current_node.set_active_time(index)

        # TODO: add sanity check that each preprocessing clause was added to passive.

        # set children
        for parent in current_node.parents:
            try:
                nodes[parent].children.add(current_node.number)
            except KeyError:
                LOG.info('Clause %d is derived from (non-final) pre-processing clause %d', current_node.number, parent)
                parent_node = Node(parent, PREPROCESSING_LABEL, PREPROCESSING_LABEL, [], [])
                parent_node.children.add(current_node.number)
                nodes[parent] = parent_node

    leaves = {node.number for node in nodes.values() if not node.children}
    return Dag(nodes, leaves)
