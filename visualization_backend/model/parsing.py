"""A parser for vampire output."""

import logging
import re
from collections import namedtuple

__all__ = 'parse'

LOG = logging.getLogger('VampireParser')
CLAUSE_REGEX = r'(\d+)\. (.*) \[(\D*) ?([\d,]*)\]( \{[a-z]\w*:\d*(?:,[a-z]\w*:\d*)*\})?'
OUTPUT_PATTERN_SATURATION = re.compile(r'^\[SA\] ([a-z ]{3,15}): ' + CLAUSE_REGEX + '$')
OUTPUT_PATTERN_REDUCTIONS = re.compile(r'^     ([a-z ]{5,12}) ' + CLAUSE_REGEX + '$')
OUTPUT_PATTERN_PREPROCESSING = re.compile(r'^' + CLAUSE_REGEX + '$')
OUTPUT_PATTERN_KEYVALUE = re.compile(r'([a-z]\w*):(\d*)')

class ParsedLine (object):
    def __init__(self, lineType, unitId, unitString, inferenceRule, parents, statistics):
        self.lineType = lineType
        self.unitId = unitId
        self.unitString = unitString
        self.inferenceRule = inferenceRule
        self.parents = parents
        self.statistics = statistics

    def to_json(self):
        return {
            'lineType': self.lineType,
            'unitId' : self.unitId,
            'unitString' : self.unitString,
            'inferenceRule' : self.inferenceRule,
            'parents' : self.parents,
            'statistics' : self.statistics
        }

def parse(lines):
    parsed_lines = []
    for line in lines:
        parsed_line = parse_line(line)
        if parsed_line is not None:
            parsed_lines.append(parsed_line)

        # we need to use the option proof_extra full, so that Vampire outputs statistics for each clause
        # as a sideeffect, this option triggers the output of the proof if saturation finishes
        # the lines of the proof must be ignored, since they violate invariants we check during parsing for the other lines.
        if line.startswith("% Refutation found. Thanks to"):
            break

    return parsed_lines

def parse_line(line):
    # first try to parse line as standard output line from saturation, i.e. line has form
    # '[SA] new: Clause', '[SA] active: Clause', '[SA] forward reduce: Clause', or '[SA] backward reduce: Clause'
    try:
        line_type, unit_id, unit_string, inference_rule, parents, statisticsString = re.match(OUTPUT_PATTERN_SATURATION, line).groups()
        if line_type == "passive":
            return
    except AttributeError:
        # next try to parse line as output from preprocessing
        try:
            unit_id, unit_string, inference_rule, parents, statisticsString = re.match(OUTPUT_PATTERN_PREPROCESSING, line).groups()
            line_type = "preprocessing"

        except AttributeError:
            # next try to parse line as 'replaced by' or 'using' line generated for clause reductions
            try:
                line_type, unit_id, unit_string, inference_rule, parents, statisticsString = re.match(OUTPUT_PATTERN_REDUCTIONS, line).groups()

            except AttributeError:
                # LOG.warning('\'%s\' does not match any pattern and will be skipped', line)
                return

    unit_id = int(unit_id)
    unit_string = unit_string.rstrip().replace("'", "").replace("\"", "")
    if statisticsString:
        statistics = dict((key, int(value)) for (key, value) in re.findall(OUTPUT_PATTERN_KEYVALUE, statisticsString))
    else:
        statistics = dict()
    inference_rule = inference_rule.rstrip()
    parents = [int(parent) for parent in parents.split(',') if parent]

    return ParsedLine(line_type, unit_id, unit_string, inference_rule, parents, statistics)

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