"""A parser for vampire output."""

import logging
import re
from collections import namedtuple

from visualization_backend.model import util
from visualization_backend.model.dag import Dag
from visualization_backend.model.node import Node
from visualization_backend.model.transformations import filter_non_active_deriving_nodes, \
    merge_preprocessing

__all__ = 'process', 'parse', 'analyse'

LOG = logging.getLogger('VampireParser')
OUTPUT_PATTERN_SATURATION = re.compile(
    r'^\[SA\] ([a-z ]{3,15}): (\d+)\. (.*) \[(\D*) ?([\d,]*)\](.*)$')
OUTPUT_PATTERN_PREPROCESSING = re.compile(r'^(\d+)\. (.*) \[(\D*) ?([\d,]*)\](.*)$')
OUTPUT_PATTERN_REDUCTIONS = re.compile(r'^     (replaced by|using) (\d+)\. (.*) \[(\D*) ?([\d,]*)\](.*)$')
PREPROCESSING_LABEL = 'Preproc'

ParsedLine = namedtuple('ParsedLine', ['type', 'number', 'clause', 'inference_rule', 'parents', 'statistics'])


def process(vampire_output):
    lines = parse(vampire_output)
    dag = analyse(lines)
    for node in dag.nodes.values():
        for parent in node.parents:
            dag.get(parent).children.append(node.number)
    return dag


def parse(vampire_output):
    """Parse vampire output line by line and build a DAG."""

    lines = vampire_output.replace('\r\n', '\n').replace('\r', '\n').split('\n')
    return [parsed_line for parsed_line in (parse_line(line) for line in lines) if parsed_line]


def parse_line(line):
    # first try to parse line as standard output line from saturation, i.e. line has form
    # '[SA] new: Clause', '[SA] passive: Clause', '[SA] active: Clause', '[SA] forward reduce: Clause', or '[SA] backward reduce: Clause'
    try:
        type_, number, clause, inference_rule, parents, statistics = re.match(OUTPUT_PATTERN_SATURATION,line).groups()
        number = int(number)
        clause = util.remove_quotes(clause.rstrip())
        inference_rule = inference_rule.rstrip()
        parents = [int(parent) for parent in parents.split(',') if parent]
        statistics = parseStatistics(statistics)
        return ParsedLine(type_, number, clause, inference_rule, parents,statistics)
    except AttributeError:
        # next try to parse line as additional lines output by reduction, i.e. line has form 
        # '     forward reduce Clause', or '     backward reduce Clause'
        try:
            type_, number, clause, inference_rule, parents, statistics = re.match(OUTPUT_PATTERN_REDUCTIONS, line).groups()
            number = int(number)
            clause = util.remove_quotes(clause.rstrip())
            inference_rule = inference_rule.rstrip()
            parents = [int(parent) for parent in parents.split(',') if parent]
            statistics = parseStatistics(statistics)
            return ParsedLine(type_, number, clause, inference_rule, parents,statistics)
        except AttributeError:
            # next try to parse line as output from preprocessing (actually from print_clausifier_premises)
            try:
                number, clause, inference_rule, parents, statistics = re.match(OUTPUT_PATTERN_PREPROCESSING, line).groups()
                type_ = "preprocessing"
                number = int(number)
                clause = util.remove_quotes(clause.rstrip())
                inference_rule = inference_rule.rstrip()
                parents = [int(parent) for parent in parents.split(',') if parent]
                statistics = parseStatistics(statistics)
                return ParsedLine(type_, number, clause, inference_rule, parents, statistics)
            except AttributeError:
                LOG.warning('\'%s\' does not match any pattern and will be skipped', line)

def parseStatistics(statisticsString):
    statisticsString = statisticsString.replace(' ','')
    if statisticsString == '': # no statistics included in parsed line
        return {}
    else: # statistics included in parsed line
        assert(statisticsString.startswith('{') and statisticsString.endswith('}'))
        keyValueStrings = statisticsString[1:-1].split(',')
        statistics = {}
        for keyValueString in keyValueStrings:
            keyValuePair = keyValueString.split(':')
            statistics[keyValuePair[0]] = int(keyValuePair[1])
        return statistics

def analyse(parsed_lines):
    """Build a DAG from parsed vampire output lines."""

    nodes = {}
    index = 0
    current_node = None
    for line in parsed_lines:

        if line.type == "preprocessing":
            assert line.number not in nodes
            current_node = Node(line.number, line.clause, line.inference_rule, line.parents, line.statistics, True)
            nodes[line.number] = current_node

        elif line.type == "new":
            if line.number not in nodes:
                # create new node
                current_node = Node(line.number, line.clause, line.inference_rule, line.parents, line.statistics, False)
                current_node.set_new_time(index)

                # hack: pretend that empty clause was added to passive and then activated
                if line.clause == "$false":
                    current_node.set_passive_time(index)
                    index = index + 1
                    current_node.set_active_time(index)
                    print("Found empty clause, therefore stopping to parse lines")
                    nodes[line.number] = current_node
                    break

                nodes[line.number] = current_node

            else:
                # fetch existing node
                current_node = nodes[line.number]
                assert current_node.is_from_preprocessing
                assert line.number == current_node.number
                assert line.inference_rule == current_node.inference_rule
                current_node.set_new_time(index)

        elif line.type == "passive":
            if line.number not in nodes:
                LOG.warning(
                    "Found clause with id %s, which was added to passive, but wasn't added as new before. Maybe you"
                    " forgot to output the new clauses?",
                    line.number)
                raise Exception("Invalid passive line {}".format(line.number))

            # fetch existing node
            current_node = nodes.get(line.number)
            assert (line.number == current_node.number)
            assert (line.inference_rule == current_node.inference_rule)
            assert (line.parents == current_node.parents or current_node.parents == [])

            # TODO:
            # The literals in the clause occur not necessarily always in the same order. Should parse them separately,
            # order them consistently and then do a sanity comparison. Parsing them is not much extra implementation
            # effort, since we anyway need it for later features.

            # set passive time
            current_node.set_passive_time(index)

        elif line.type == "active":
            if line.number not in nodes:
                LOG.warning(
                    "Found clause with id %s, which was added to active, but wasn't added to passive before. Maybe you"
                    " forgot to output the passive clauses?",
                    line.number)
                raise Exception("Invalid active line {}".format(line.number))

            current_node = nodes.get(line.number)
            assert (line.number == current_node.number)
            assert (line.inference_rule == current_node.inference_rule)
            assert (line.parents == current_node.parents or current_node.parents == [])

            # TODO:
            # The literals in the clause occur not necessarily always in the same order. Should parse them separately,
            # order them consistently and then do a sanity comparison. Parsing them is not much extra implementation
            # effort, since we anyway need it for later features.
            # TODO:
            # think about a smarter way how to merge statistics from different points in time.
            # Currently the statistics printed for active clauses subsume all other statistics, so we always use the 
            # statistics from the line where the clause is activated (if available).
            current_node.set_statistics(line.statistics)
            current_node.set_clause(line.clause)

            # set active time
            index = index + 1
            current_node.set_active_time(index)
        elif line.type == "forward reduce" or line.type == "backward reduce": 
            if line.number not in nodes:
                LOG.warning(
                    "Found clause with id %s, which was deleted, but wasn't added as new clause before. Maybe you"
                    " forgot to output the passive clauses?",
                    line.number)
                raise Exception("Invalid active line {}".format(line.number))
            
            current_node = nodes.get(line.number)
            current_node.set_deletion_time(index)

        elif line.type == "replaced by" or line.type == "using":
            assert current_node is not None
            current_node.add_deletion_parent(line.number)           
        else:
            # unreachable
            raise Exception("Invalid line {}".format(repr(line)))

    parsed_dag = Dag(nodes)

    dag = filter_non_active_deriving_nodes(parsed_dag)

    print("number of nodes in parsed dag: " + str(len(parsed_dag.nodes)))
    print("number of nodes in active dag: " + str(len(dag.nodes)))

    merged_dag = merge_preprocessing(dag)

    return merged_dag
