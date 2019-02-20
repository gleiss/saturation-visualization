"""A parser for vampire output"""

import logging
import re
from collections import namedtuple

from proof_visualization.model.dag import Dag
from proof_visualization.model.node import Node

from proof_visualization.model.transformations import filterNonActiveDerivingNodes

import proof_visualization.model.util as util

__all__ = 'process', 'parse', 'analyse'

LOG = logging.getLogger('VampireParser')
OUTPUT_PATTERN_SATURATION = re.compile(r'^(\[[A-Z]{2}\] [a-z]{3,7}): (\d+)\. (.*) \(([\d:]+)\)([T ]+)\[(\D*) ?([\d,]*)\]$')
OUTPUT_PATTERN_PREPROCESSING = re.compile(r'^(\d+)\. (.*) \[(\D*) ?([\d,]*)\]$')

PREPROCESSING_LABEL = 'Preproc'

ParsedLine = namedtuple('ParsedLine', ['type', 'number', 'clause', 'statistics', 'inference_rule', 'parents'])


def process(vampire_output):
    lines = parse(vampire_output)
    return analyse(lines)


def parse(vampire_output):
    """Parse vampire output line by line and build a DAG.

    """

    lines = vampire_output.replace('\r\n', '\n').replace('\r', '\n').split('\n')
    return [parsed_line for parsed_line in (parse_line(line) for line in lines) if parsed_line]


def parse_line(line):
    # first try to parse line as output from saturation, i.e. line has form
    # [SA] new: Clause, [SA] passive: Clause, or [SA] active: Clause
    try:
        type_, number, clause, statistics, _, inference_rule, parents = re.match(OUTPUT_PATTERN_SATURATION, line).groups()
        type_ = type_.split(']')[1].strip()
        number = int(number)
        clause = util.remove_quotes(clause.rstrip())
        statistics = [int(stat) for stat in statistics.split(':')]
        inference_rule = inference_rule.rstrip()
        parents = [int(parent) for parent in parents.split(',') if parent]

        return ParsedLine(type_, number, clause, statistics, inference_rule, parents)
    except AttributeError:
        # next try to parse line as output from preprocessing (actually from print_clausifier_premises)
        try:
            number, clause, inference_rule, parents = re.match(OUTPUT_PATTERN_PREPROCESSING, line).groups()
            type_ = "preprocessing"
            number = int(number)
            clause = util.remove_quotes(clause.rstrip())
            statistics = []
            inference_rule = inference_rule.rstrip()
            parents = [int(parent) for parent in parents.split(',') if parent]

            return ParsedLine(type_, number, clause, statistics, inference_rule, parents)
        except AttributeError:
            LOG.warning('\'%s\' does not match any pattern and will be skipped', line)

def analyse(parsed_lines):
    """Build a DAG from parsed vampire output lines."""

    nodes = {}
    index = 0
    for line in parsed_lines:

        # clause occurs in preprocessing
        if line.type == "preprocessing":
            assert(not line.number in nodes)
            
            # create new node
            current_node = Node(line.number, line.clause, line.inference_rule, line.parents, line.statistics, True)
            nodes[line.number] = current_node

        elif line.type == "new" and (not line.number in nodes):
            # create new node
            current_node = Node(line.number, line.clause, line.inference_rule, line.parents, line.statistics, False)
            nodes[line.number] = current_node

            # set new time
            current_node.set_new_time(index)

        elif line.type == "new" and (line.number in nodes):
            # get existing node
            current_node = nodes.get(line.number)
            assert(current_node.is_from_preprocessing == True)
            assert(line.number == current_node.number)
            assert(line.inference_rule == current_node.inference_rule)
        
            # set new time
            current_node.set_new_time(index)
            
        elif line.type == "passive" and (line.number in nodes):
            if not line.number in nodes:
                LOG.warning("Found clause with id %s, which was added to passive, but wasn't added as new before. Maybe you forgot to output the new clauses?", line.number)
                assert(False)
            # get existing node
            current_node = nodes.get(line.number)
            assert(line.number == current_node.number)
            assert(line.inference_rule == current_node.inference_rule)
            assert(line.parents == current_node.parents or current_node.parents == [])

            # TODO: the literals in the clause occur not necessarily always in the same order. Should parse them separately, order them consistently and then do a sanity comparison. Parsing them is not much extra implementation effort, since we anyway need it for later features.

            # set passive time
            current_node.set_passive_time(index)

        elif line.type == "active":
            if not line.number in nodes:
                LOG.warning("Found clause with id %s, which was added to active, but wasn't added to passive before. Maybe you forgot to output the passive clauses?", line.number)
                assert(False)

            current_node = nodes.get(line.number)
            assert(line.number == current_node.number)
            assert(line.inference_rule == current_node.inference_rule)
            assert(line.parents == current_node.parents or current_node.parents == [])

            # TODO: the literals in the clause occur not necessarily always in the same order. Should parse them separately, order them consistently and then do a sanity comparison. Parsing them is not much extra implementation effort, since we anyway need it for later features.
            # TODO: collect the selected literal, which is only there at some point (probably at the point where the clause gets activated)

            # set active time
            index = index + 1
            current_node.set_active_time(index)

        else:
            # unreachable
            print(line)
            assert((line.type == "final") or (line.type == "new") or (line.type == "passive") or (line.type == "active"))
            assert(False)
    
    parsedDag = Dag(nodes)

    dag = filterNonActiveDerivingNodes(parsedDag)

    print("number of nodes in parsed dag: " + str(len(parsedDag.nodes)))
    print("number of nodes in active dag: " + str(len(dag.nodes)))

    return dag
