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

def parse(vampire_output):
    lines = vampire_output.replace('\r\n', '\n').replace('\r', '\n').split('\n')
    lines2 = []
    for line in lines:
        if line.startswith("% Refutation found. Thanks to"):
            break
        else:
            lines2.append(line)
    return [parsed_line for parsed_line in (parse_line(line) for line in lines2) if parsed_line]

def parse_line(line):
    # first try to parse line as standard output line from saturation, i.e. line has form
    # '[SA] new: Clause', '[SA] passive: Clause', '[SA] active: Clause', '[SA] forward reduce: Clause', or '[SA] backward reduce: Clause'
    try:
        line_type, unit_id, unit_string, inference_rule, parents, statisticsString = re.match(OUTPUT_PATTERN_SATURATION, line).groups()
        # line_type = line_type.split(']')[1].strip()

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