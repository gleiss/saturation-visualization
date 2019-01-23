"""A parser for vampire output"""

import logging
import re

from proof_visualization.model.dag import Dag
from proof_visualization.model.node import Node

__all__ = 'process', 'parse', 'analyse'

LOG = logging.getLogger('VampireParser')
OUTPUT_PATTERN = re.compile(r'^\[SA\] active: ([\d]+)\. (.*) ?\[(\D*) ?([\d,]*)\]$')

PREPROCESSING_LABEL = 'Preproc'


def process(vampire_output):
    return analyse(parse(vampire_output))


def parse(vampire_output):
    """Parse vampire output line by line and build a DAG.

    The parser can only deal with active clauses!
    """

    lines = vampire_output.split('\n')
    return (parsed_line for parsed_line in (parse_line(line) for line in lines) if parsed_line)


def parse_line(line):
    try:
        number, clause, rule, parents = re.match(OUTPUT_PATTERN, line).groups()
        number = int(number)
        clause = clause.rstrip()
        rule = rule.rstrip()
        parents = [int(parent) for parent in parents.split(',') if parent]
        return Node(number, clause, rule, parents)
    except AttributeError:
        LOG.warning('\'%s\' does not match the pattern and will be skipped', line)


def analyse(parsed_lines):
    """Build a DAG from parsed vampire output lines."""

    nodes = {}
    for node in parsed_lines:
        nodes[node.number] = node
        for parent in node.parents:
            try:
                nodes[parent].children.add(node.number)
            except KeyError:
                LOG.info('Clause %d is derived from pre-processing clause %d', node.number, parent)
                parent_node = Node(parent, PREPROCESSING_LABEL, PREPROCESSING_LABEL, [])
                parent_node.children.add(node.number)
                nodes[parent] = parent_node

    leaves = {node.number for node in nodes.values() if not node.children}
    return Dag(nodes, leaves)
