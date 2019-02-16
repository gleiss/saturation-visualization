"""A parser for vampire output"""

import logging
import re
from collections import namedtuple

from proof_visualization.model.dag import Dag
from proof_visualization.model.node import Node

__all__ = 'process', 'parse', 'analyse'

LOG = logging.getLogger('VampireParser')
OUTPUT_PATTERN = re.compile(r'^(\[[A-Z]{2}\] [a-z]{5,7}): (\d+)\. (.*) \(([\d:]+)\)([T ]+)\[(\D*) ?([\d,]*)\]$')

PREPROCESSING_LABEL = 'Preproc'

ParsedLine = namedtuple('ParsedLine', ['type', 'number', 'clause', 'statistics', 'rule', 'parents'])


def process(vampire_output):
    lines = parse(vampire_output)
    return analyse(lines), len(lines)


def parse(vampire_output):
    """Parse vampire output line by line and build a DAG.

    The parser can only deal with active clauses!
    """

    lines = vampire_output.replace('\r\n', '\n').replace('\r', '\n').split('\n')
    return [parsed_line for parsed_line in (parse_line(line) for line in lines) if parsed_line]


def parse_line(line):
    try:
        type_, number, clause, statistics, axiom_marker, rule, parents = re.match(OUTPUT_PATTERN, line).groups()
        type_ = type_.split(']')[1].strip()
        number = int(number)
        clause = clause.rstrip()
        statistics = [int(stat) for stat in statistics.split(':')]
        rule = rule.rstrip()
        parents = [int(parent) for parent in parents.split(',') if parent]
        return ParsedLine(type_, number, clause, statistics, rule, parents)
    except AttributeError:
        LOG.warning('\'%s\' does not match the pattern and will be skipped', line)


def analyse(parsed_lines):
    """Build a DAG from parsed vampire output lines."""

    nodes = {}
    for index, line in enumerate(parsed_lines):
        current_node = nodes.setdefault(line.number,
                                        Node(line.number, line.clause, line.rule, line.parents, line.statistics))

        # set line type info
        if line.type == 'final':
            # clause occurs in final preprocessing
            current_node.is_from_preprocessing = True
        elif line.type == 'passive':
            current_node.set_passive_time(index)
        elif line.type == 'active':
            current_node.set_active_time(index)

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
