import { i } from '@bablr/boot/shorthand.macro';
import { Node, CoveredBy, InjectFrom } from '@bablr/helpers/decorators';
import * as productions from '@bablr/helpers/productions';
import * as Regex from '@bablr/language-regex-vm-pattern';
import * as CSTML from '@bablr/language-cstml';
import * as Comment from '@bablr/language-c-comments';

export const canonicalURL = 'https://bablr.org/languages/core/spamex';

export const dependencies = { Regex, CSTML, Comment };

const { eatMatchTrivia } = CSTML;

export const grammar = class SpamexGrammar {
  @CoveredBy('Expression')
  *Matcher() {
    yield i`eat(<Any> null [
        <NodeMatcher '<'>
        <CSTML:String /['"]/>
        <Regex:Pattern '/'>
      ])`;
  }

  @CoveredBy('Matcher')
  @CoveredBy('Expression')
  @Node
  *NodeMatcher() {
    yield i`eat(<*Punctuator '<' balancedSpan='Tag' balanced='>'> 'open')`;
    yield i`eatMatch(<CSTML:Flags>)`;
    if (yield i`match(/\w+:/)`) {
      yield i`eat(<*CSTML:Identifier> 'language')`;
      yield i`eat(<*Punctuator ':'> 'namespaceOperator')`;
      yield i`eat(<*CSTML:Identifier> 'type')`;
    } else {
      yield i`eat(null 'language')`;
      yield i`eat(null 'namespaceOperator')`;
      yield i`eat(<*CSTML:Identifier> 'type')`;
    }
    let sp = yield* eatMatchTrivia();

    if (sp && (yield i`eatMatch(<StringMatcher> 'children[]')`)) {
      sp = yield* eatMatchTrivia();
    }

    while (sp && (yield i`match(/!?\w/)`)) {
      yield i`eat(<Attribute> 'attributes[]')`;
      sp = yield* eatMatchTrivia();
    }
    yield i`eat(<*Punctuator '>' balancer> 'close')`;
  }

  *Attributes() {
    yield i`eatMatch(<List> null {
        element: <Attribute>
        allowTrailingSeparator: false
      })`;
  }

  *Attribute() {
    if (yield i`match(/\w+\s*=/)`) {
      yield i`eat(<MappingAttribute>)`;
    } else {
      yield i`eat(<BooleanAttribute>)`;
    }
  }

  @CoveredBy('Attribute')
  @Node
  *BooleanAttribute() {
    yield i`eat(<*CSTML:Identifier> 'key')`;
  }

  @CoveredBy('Attribute')
  @Node
  *MappingAttribute() {
    yield i`eat(<*CSTML:Identifier> 'key')`;
    yield i`eat(<*Punctuator '='> 'mapOperator')`;
    yield i`eat(<CSTML:String> 'value')`;
  }

  @CoveredBy('Matcher')
  @CoveredBy('Expression')
  *StringMatcher() {
    if (yield i`match(/['"]/)`) {
      yield i`eat(<CSTML:String>)`;
    } else {
      yield i`eat(<Regex:Pattern>)`;
    }
  }

  @CoveredBy('StringMatcher')
  @CoveredBy('Matcher')
  @CoveredBy('Expression')
  @Node
  *String() {
    yield i`eat(<CSTML:String>)`;
  }

  @CoveredBy('StringMatcher')
  @CoveredBy('Matcher')
  @CoveredBy('Expression')
  @Node
  *Regex() {
    yield i`eat(<*Punctuator '/' balanced='/'> 'open')`;
    yield i`eat(<Regex:Alternatives> 'alternatives[]')`;
    yield i`eat(<*Punctuator '/' balancer> 'close')`;
    yield i`eat(<Regex:Flags> 'flags')`;
  }

  @InjectFrom(productions)
  List() {}

  @InjectFrom(productions)
  Match() {}

  @Node
  @InjectFrom(productions)
  Punctuator() {}
};